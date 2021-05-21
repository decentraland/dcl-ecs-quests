/// <reference types="dcl" />
/// <reference types="env" />
declare module "@dcl/types" {
    import { Visibility } from "dcl-quests-client/quests-client-amd";
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
}
declare module "@dcl/component" {
    import { QuestForRenderer } from "@dcl/types";
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
declare module "@dcl/mappings" {
    import { QuestForRenderer } from "@dcl/types";
    export function toRendererQuest(serverDetails: any): QuestForRenderer;
}
declare module "@dcl/RemoteQuestTracker" {
    import { ClientResponse, QuestState, ProgressData, QuestsClient } from "dcl-quests-client/quests-client-amd";
    import { ArbitraryStateChange } from "node_modules/dcl-quests-client/index";
    type QuestTrackerOptions = {
        baseUrl: string;
        clientFactory: (baseUrl: string) => QuestsClient;
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
declare module "@dcl/ecs-quests" {
    export * from "@dcl/component";
    export * from "@dcl/mappings";
    export * from "@dcl/types";
    export * from "@dcl/RemoteQuestTracker";
}
declare module "@dcl/quests-query" {
    import { PlayerGivenReward, ProgressStatus, ProgressSummary, QuestState } from "dcl-quests-client/quests-client-amd";
    export interface QuestStateQuery {
        getTaskStatus(taskId: string): ProgressStatus | undefined;
        getStepStatus(stepId: string): ProgressStatus | undefined;
        isTaskCompleted(taskId: string): boolean;
        isStepCompleted(stepId: string): boolean;
        getTaskProgress(taskId: string): ProgressSummary | undefined;
        getAllGivenRewards(): PlayerGivenReward[];
    }
    export function query(state: QuestState): QuestStateQuery;
}
