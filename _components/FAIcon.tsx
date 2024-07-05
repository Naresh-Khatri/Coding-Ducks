import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function FAIcon({ icon, ...props }: { icon: IconProp; [key: string]: any }) {
  return (
    <FontAwesomeIcon icon={icon as IconProp} height={"1.2rem"} {...props} />
  );
}

export default FAIcon;
