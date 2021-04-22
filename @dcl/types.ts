import {Visibility} from "dcl-quests-client/quests-client-amd";

export type SectionForRenderer = {
  id: string;
  name: string;
  progress: number;
  tasks: TaskForRenderer[];
};

export type TaskForRenderer = {
  id: string;
  name: string;
  type: string;
  progress: number;
  status: string;
  coordinates?: string;
  payload: string;
};

export type QuestForRenderer = {
  id: string;
  name: string;
  description: string;
  thumbnail_entry?: string;
  thumbnail_banner?: string;
  status: string;
  icon?: string;
  sections: SectionForRenderer[];
  rewards: RewardForRenderer[];
  visibility: Visibility; 
};

export type RewardForRenderer = {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
  status: string;
};
