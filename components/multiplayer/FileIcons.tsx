import Image from "next/image";

import c from "../../assets/lang-icons/c.svg";
import console from "../../assets/lang-icons/console.svg";
import cpp from "../../assets/lang-icons/cpp.svg";
import css from "../../assets/lang-icons/css.svg";
import database from "../../assets/lang-icons/database.svg";
import docker from "../../assets/lang-icons/docker.svg";
import document from "../../assets/lang-icons/document.svg";
import git from "../../assets/lang-icons/git.svg";
import html from "../../assets/lang-icons/html.svg";
import java from "../../assets/lang-icons/java.svg";
import javascript from "../../assets/lang-icons/javascript.svg";
import json from "../../assets/lang-icons/json.svg";
import markdown from "../../assets/lang-icons/markdown.svg";
import nodejs from "../../assets/lang-icons/nodejs.svg";
import php from "../../assets/lang-icons/php.svg";
import python from "../../assets/lang-icons/python.svg";
import react from "../../assets/lang-icons/react.svg";
import ruby from "../../assets/lang-icons/ruby.svg";
import rust from "../../assets/lang-icons/rust.svg";
import tune from "../../assets/lang-icons/tune.svg";
import typescript from "../../assets/lang-icons/typescript.svg";
import vue from "../../assets/lang-icons/vue.svg";
import xml from "../../assets/lang-icons/xml.svg";
import yaml from "../../assets/lang-icons/yaml.svg";
import yarn from "../../assets/lang-icons/yarn.svg";

type Extension =
  | "c"
  | "cpp"
  | "js"
  | "py"
  | "java"
  | "css"
  | "html"
  | "ts"
  | "tsx"
  | "jsx"
  | "json"
  | "md"
  | "rb"
  | "rs"
  | "php"
  | "sh"
  | "sql"
  | "vue"
  | "xml"
  | "yaml";

function FileIcons({ fileName, width }: { fileName: string; width: number }) {
  const extension = fileName.split(".").at(-1) as Extension;

  let imgSource = document;

  // filename
  if (fileName === "package.json") imgSource = nodejs;
  else if (/\w+\.env$/.test(fileName)) imgSource = tune;
  else if (fileName === "Dockerfile") imgSource = docker;
  else if (fileName === ".gitignore") imgSource = git;
  else if (fileName === "yarn.lock" || fileName === "yarn") imgSource = yarn;
  // extensions
  else if (extension === "c") imgSource = c;
  else if (extension === "cpp") imgSource = cpp;
  else if (extension === "py") imgSource = python;
  else if (extension === "js") imgSource = javascript;
  else if (extension === "java") imgSource = java;
  else if (extension === "css") imgSource = css;
  else if (extension === "html") imgSource = html;
  else if (extension === "ts") imgSource = typescript;
  else if (extension === "tsx" || extension === "jsx") imgSource = react;
  else if (extension === "md") imgSource = markdown;
  else if (extension === "rb") imgSource = ruby;
  else if (extension === "rs") imgSource = rust;
  else if (extension === "php") imgSource = php;
  else if (extension === "sh") imgSource = console;
  else if (extension === "sql") imgSource = database;
  else if (extension === "vue") imgSource = vue;
  else if (extension === "xml") imgSource = xml;
  else if (extension === "yaml") imgSource = yaml;
  else if (extension === "json") imgSource = json;

  return <Image width={width} src={imgSource} alt="language icon" />;
}

export default FileIcons;
