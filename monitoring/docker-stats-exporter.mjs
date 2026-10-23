"use strict";

import http from "node:http";

const dockerSocket = process.env.DOCKER_SOCKET ?? "/var/run/docker.sock";
const projectName = process.env.COMPOSE_PROJECT_NAME ?? "news-portal";
const dockerApiVersion = "v1.41";

function dockerGet(path) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        socketPath: dockerSocket,
        path: `/${dockerApiVersion}${path}`,
        method: "GET",
        timeout: 5000,
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`Docker Engine returned HTTP ${response.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.on("timeout", () => request.destroy(new Error("Docker Engine request timed out")));
    request.on("error", reject);
    request.end();
  });
}

function escapeLabel(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll('"', '\\"');
}

function metric(name, labels, value) {
  const formattedLabels = Object.entries(labels)
    .map(([key, labelValue]) => `${key}="${escapeLabel(labelValue)}"`)
    .join(",");
  return `${name}{${formattedLabels}} ${Number.isFinite(value) ? value : 0}`;
}

async function collectMetrics() {
  const containers = await dockerGet("/containers/json?all=0");
  const projectContainers = containers.filter(
    (container) => container.Labels?.["com.docker.compose.project"] === projectName,
  );

  const samples = await Promise.all(
    projectContainers.map(async (container) => {
      const name = container.Names?.[0]?.replace(/^\//, "") ?? container.Id.slice(0, 12);
      const service = container.Labels?.["com.docker.compose.service"] ?? "unknown";
      const stats = await dockerGet(`/containers/${container.Id}/stats?stream=false`);
      const cpuDelta =
        (stats.cpu_stats?.cpu_usage?.total_usage ?? 0) -
        (stats.precpu_stats?.cpu_usage?.total_usage ?? 0);
      const systemDelta =
        (stats.cpu_stats?.system_cpu_usage ?? 0) -
        (stats.precpu_stats?.system_cpu_usage ?? 0);
      const cpuCount =
        stats.cpu_stats?.online_cpus ?? stats.cpu_stats?.cpu_usage?.percpu_usage?.length ?? 1;
      const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * cpuCount * 100 : 0;
      const memoryUsage = Math.max(
        0,
        (stats.memory_stats?.usage ?? 0) - (stats.memory_stats?.stats?.cache ?? 0),
      );
      const networkStats = Object.values(stats.networks ?? {});
      const networkRx = networkStats.reduce((sum, network) => sum + (network.rx_bytes ?? 0), 0);
      const networkTx = networkStats.reduce((sum, network) => sum + (network.tx_bytes ?? 0), 0);

      return [
        metric("news_portal_container_cpu_percent", { container: name, service }, cpuPercent),
        metric("news_portal_container_memory_usage_bytes", { container: name, service }, memoryUsage),
        metric("news_portal_container_memory_limit_bytes", { container: name, service }, stats.memory_stats?.limit ?? 0),
        metric("news_portal_container_network_receive_bytes_total", { container: name, service }, networkRx),
        metric("news_portal_container_network_transmit_bytes_total", { container: name, service }, networkTx),
      ];
    }),
  );

  return [
    "# HELP news_portal_container_cpu_percent Docker container CPU usage percentage.",
    "# TYPE news_portal_container_cpu_percent gauge",
    "# HELP news_portal_container_memory_usage_bytes Docker container memory usage excluding cache.",
    "# TYPE news_portal_container_memory_usage_bytes gauge",
    "# HELP news_portal_container_memory_limit_bytes Docker container memory limit in bytes.",
    "# TYPE news_portal_container_memory_limit_bytes gauge",
    "# HELP news_portal_container_network_receive_bytes_total Docker container bytes received.",
    "# TYPE news_portal_container_network_receive_bytes_total counter",
    "# HELP news_portal_container_network_transmit_bytes_total Docker container bytes transmitted.",
    "# TYPE news_portal_container_network_transmit_bytes_total counter",
    ...samples.flat(),
  ].join("\n");
}

const server = http.createServer(async (request, response) => {
  if (request.url === "/healthz") {
    response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    response.end("ok\n");
    return;
  }

  if (request.url !== "/metrics") {
    response.writeHead(404);
    response.end("not found\n");
    return;
  }

  try {
    const output = await collectMetrics();
    response.writeHead(200, { "content-type": "text/plain; version=0.0.4; charset=utf-8" });
    response.end(`${output}\n`);
  } catch (error) {
    console.error("Docker stats collection failed:", error);
    response.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
    response.end("Docker stats collection failed\n");
  }
});

server.listen(9324, "0.0.0.0");
