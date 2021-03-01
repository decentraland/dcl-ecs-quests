/// <reference types="dcl" />
/// <reference types="env" />
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
declare module "RemoteQuestTracker" {
    import { ClientResponse, QuestState, ProgressData, QuestsClient } from "dcl-quests-client/quests-client-amd";
    import { ArbitraryStateChange } from "node_modules/dcl-quests-client/index";
    type QuestTrackerOptions = {
        clientFactory: () => QuestsClient;
        logErrors: boolean;
        addToEngine: boolean;
    };
    export class RemoteQuestTracker {
        private questId;
        private options;
        private client;
        private currentState;
        private currentStatePromise?;
        entity: Entity;
        constructor(questId: string, options?: Partial<QuestTrackerOptions>);
        refresh(): Promise<ClientResponse<QuestState>>;
        startQuest(): Promise<ClientResponse<QuestState>>;
        makeProgress(taskId: string, progressData: ProgressData): Promise<ClientResponse<QuestState>>;
        updateArbitraryState(changes: ArbitraryStateChange[]): Promise<ClientResponse<QuestState>>;
        getCurrentStatePromise(): Promise<QuestState | undefined>;
        getCurrentState(): QuestState | undefined;
        private makeRequest;
        private updateQuest;
    }
}
declare module "dcl-ecs-quests" {
    export * from "component";
    export * from "mappings";
    export * from "types";
    export * from "RemoteQuestTracker";
}
