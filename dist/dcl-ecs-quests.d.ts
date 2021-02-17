declare module "types" {
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
    };
}
declare module "component" {
    import { QuestForRenderer } from "types";
    /**
     * Holds the information of a quest
     * @public
     */
    export class QuestTrackingInfo {
        questData: QuestForRenderer;
        constructor(questData: QuestForRenderer);
        toJSON(): QuestForRenderer;
    }
}
declare module "mappings" {
    import { QuestForRenderer } from "types";
    export function toRendererQuest(serverDetails: any): QuestForRenderer;
}
