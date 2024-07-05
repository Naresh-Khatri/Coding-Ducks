import Head from "next/head";
import React from "react";

export interface SetMetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  schema?: string;
}

function SetMeta({
  title,
  description,
  keywords,
  image,
  url,
  schema,
}: SetMetaProps) {
  title =
    title || "Coding Ducks - Practice Coding Problems in Multiple Languages";
  description =
    description ||
    `Coding Ducks is a platform where you can enhance your coding skills by solving a variety of coding problems. Practice and improve your programming abilities in Python, JavaScript, C++, and Java with our collection of coding challenges.`;
  keywords =
    keywords ||
    `coding problems, coding challenges, programming practice, Python, JavaScript, C++, Java, coding website, programming exercises, algorithmic problem solving`;
  image =
    image ||
    "https://ik.imagekit.io/couponluxury/coding_ducks/og_logo_jpRQg8f-Z.png";
  url = url || "https://www.codingducks.xyz/";

  const scripts = extractScriptContents(schema);
  return (
    <Head>
      {/* TITLE */}
      <title>{title}</title>
      <meta property="og:title" content={title} />
      <meta name="twitter:title" content={title} />

      {/* DESCRIPTION */}
      <meta name="description" content={description} />
      <meta property="og:description" content={description} />
      <meta name="twitter:description" content={description} />

      {/* SCHEMA */}
      {scripts.map((script, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: script }}
        />
      ))}

      {/* KEYWORDS */}
      <meta name="keywords" content={keywords} />

      {/* IMAGES */}
      <meta property="og:image" content={image} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image" content={image} />
      <meta
        name="twitter:image:alt"
        content="Coding Ducks - Practice Coding Problems in Multiple Languages"
      />
      <meta itemProp="image" content={image} />

      {/* URL */}
      <meta name="url" content={url.toLowerCase()} />
      <meta property="og:url" content={url.toLowerCase()} />
      <meta name="twitter:url" content={url.toLowerCase()} />
      <link rel="canonical" href={url.toLowerCase()} />
    </Head>
  );
}

const extractScriptContents = (xmlString = "") => {
  const scriptStartTag = '<script type="application/ld+json">';
  const scriptEndTag = "</script>";
  if (
    !xmlString ||
    xmlString.trim().length == 0 ||
    !xmlString.includes(scriptStartTag)
  )
    return [];

  const scriptContents: string[] = [];
  let startIndex = xmlString.indexOf(scriptStartTag);

  while (startIndex !== -1) {
    const endIndex = xmlString.indexOf(
      scriptEndTag,
      startIndex + scriptStartTag.length
    );

    if (endIndex !== -1) {
      const scriptContent = xmlString
        .slice(startIndex + scriptStartTag.length, endIndex)
        .trim();
      scriptContents.push(scriptContent);
    }

    startIndex = xmlString.indexOf(
      scriptStartTag,
      endIndex + scriptEndTag.length
    );
  }

  return scriptContents;
};

export default SetMeta;
