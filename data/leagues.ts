import { ColorProps, ResponsiveValue } from "@chakra-ui/react";
import { ILeague, ILeagueLabel } from "../types";
import {
  faCrown,
  faGem,
  faKhanda,
  faLightbulb,
  faRocket,
  faSeedling,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface League {
  label: ILeagueLabel;
  value: ILeague;
  color: ResponsiveValue<ColorProps["color"]>;
  bgGradient?: string;
  icon?: IconProp;
}

export const LEAGUES: { [key in ILeague]: League } = {
  noob: {
    value: "noob",
    label: "Noob",
    color: "#90EE90",
    bgGradient: "linear(to-r, #0F9246, #7EBB42)",
    icon: faSeedling,
  },
  beginner: {
    value: "beginner",
    label: "Beginner",
    color: "yellow",
    bgGradient: "linear(to-r, #0077FF, #FFD500)",
    icon: faLightbulb,
  },
  intermediate: {
    value: "intermediate",
    label: "Intermediate",
    color: "#FFA07A",
    bgGradient: "linear(to-r, #FFD500, #FF007F)",
    icon: faRocket,
  },
  advance: {
    value: "advance",
    label: "Advance",
    color: "cyan",
    bgGradient: "linear(to-r, #FF007F, #FFD500)",
    icon: faGem,
  },
  expert: {
    value: "expert",
    label: "Expert",
    color: "#FFD700",
    bgGradient: "linear(to-r, #D500FF, #FF007F)",
    icon: faTrophy,
  },
  master: {
    value: "master",
    label: "Master",
    color: "#c000c0",
    bgGradient: "linear(to-r, #00FFD1, #FF007F)",
    icon: faCrown,
  },
  grandmaster: {
    value: "grandmaster",
    label: "Grand Master",
    color: "gold",
    bgGradient: "linear(to-r, #FF005B, #FF7200)",
    icon: faKhanda,
  },
};
