import { Metadata } from "next";
import { SetMetaProps } from "./SetMeta";
import { metadata } from "app/layout";

const generateMeta = async ({
  title,
  description,
  keywords,
  image,
  url,
}: SetMetaProps): Promise<Metadata> => {
  const _title =
    title || "Coding Ducks - Practice Coding Problems in Multiple Languages";
  const _description =
    description ||
    `Coding Ducks is a platform where you can enhance your coding skills by solving a variety of coding problems. Practice and improve your programming abilities in Python, JavaScript, C++, and Java with our collection of coding challenges.`;
  const _keywords =
    keywords ||
    `coding problems, coding challenges, programming practice, Python, JavaScript, C++, Java, coding website, programming exercises, algorithmic problem solving`;
  const _image =
    image ||
    "https://ik.imagekit.io/couponluxury/coding_ducks/og_logo_jpRQg8f-Z.png";
  const _url = url || "https://www.codingducks.xyz/";

  let metaData: Metadata = {};

  /**
   * TITLE
   */

  metaData = {
    ...metaData,
    title: _title,
    openGraph: { ...metaData.openGraph, title: _title },
  };
  /**
   * DESCRIPTION
   */
  metaData = {
    ...metaData,
    description: _description,
    openGraph: { ...metaData.openGraph, description: _description },
  };

  /**
   * KEYWORDS
   */
  metaData = {
    ...metaData,
    keywords: _keywords,
  };

  /**
   * IMAGE
   */
  metaData = {
    ...metaData,
    openGraph: { ...metaData.openGraph, images: _image },
  };

  /**
   * URL
   */
  metaData = {
    ...metaData,
    alternates: { ...metaData.alternates, canonical: _url },
  };
  return metaData;
};
export default generateMeta;
