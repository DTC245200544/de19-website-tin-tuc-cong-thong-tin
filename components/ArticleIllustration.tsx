import Image from "next/image";

const photographs: Record<string, string> = {
  "thoi-su": "thoi-su.jpg",
  "kinh-doanh": "kinh-doanh.jpg",
  "cong-nghe": "cong-nghe.jpg",
  "giao-duc": "giao-duc.jpg",
  "suc-khoe": "suc-khoe.jpg",
  "doi-song": "doi-song.jpg",
  "van-hoa": "van-hoa.jpg",
  "the-thao": "the-thao.jpg",
  "du-lich": "du-lich.jpg",
  xe: "xe.jpg",
  "thoi-trang": "thoi-trang.jpg",
  "phap-luat": "phap-luat.jpg",
  "moi-truong": "moi-truong.jpg",
  "the-gioi": "the-gioi.jpg",
};

export function ArticleIllustration({
  categorySlug,
  className = "",
}: {
  categorySlug: string;
  className?: string;
}) {
  const image = photographs[categorySlug];

  return (
    <div className={`editorial-art ${className}`}>
      <Image
        src={image ? `/images/news/${image}` : "/images/editorial/newsroom.svg"}
        alt=""
        fill
        sizes="(max-width: 650px) 92vw, (max-width: 900px) 55vw, 760px"
      />
    </div>
  );
}
