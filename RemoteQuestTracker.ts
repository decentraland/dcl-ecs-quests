import {
  ClientResponse,
  PlayerQuestDetails,
  ProgressData,
  QuestsClient,
} from "dcl-quests-client/quests-client-amd";
import { signedFetch } from "@decentraland/SignedFetch";
import { QuestTrackingInfo } from "./component";
import { toRendererQuest } from "./mappings";

type QuestTrackerOptions = {
  clientFactory: () => QuestsClient;
  logErrors: boolean;
  addToEngine: boolean;
};

const defaultOptions = {
  clientFactory: () =>
    new QuestsClient({
      baseUrl: "https://quests-api.decentraland.io",
      fetchFn: signedFetch,
    }),
  logErrors: true,
  addToEngine: true,
};

export class RemoteQuestTracker {
  private options: QuestTrackerOptions;
  private client: QuestsClient;

  public entity: Entity;

  constructor(private questId: string, options?: Partial<QuestTrackerOptions>) {
    this.options = { ...defaultOptions, ...(options ?? {}) };
    this.client = this.options.clientFactory();
    this.entity = new Entity();

    if (this.options.addToEngine) {
      engine.addEntity(this.entity);
    }

    this.refresh();
  }

  async refresh() {
    return this.updateQuest(
      await this.makeRequest(() => this.client.getQuestDetails(this.questId))
    );
  }

  async startQuest() {
    return this.updateQuest(
      await this.makeRequest(() => this.client.startQuest(this.questId))
    );
  }

  async makeProgress(taskId: string, progressData: ProgressData) {
    return this.updateQuest(
      await this.makeRequest(() =>
        this.client.makeProgress(this.questId, taskId, progressData)
      )
    );
  }

  private async makeRequest<T>(request: () => Promise<ClientResponse<T>>) {
    const response = await request();
    if (!response.ok) {
      if (this.options.logErrors) {
        log(
          `Error performing request on quest with id: ${this.questId}. Status: ${response.status}`,
          { body: response.body }
        );
      }
    }
    return response;
  }

  private updateQuest(response: ClientResponse<PlayerQuestDetails>) {
    if (response.ok) {
      this.entity.addComponentOrReplace(
        new QuestTrackingInfo(toRendererQuest(response.body))
      );
    }

    return response;
  }
}
