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

  private currentState: PlayerQuestDetails | undefined;
  private currentStatePromise?: Promise<PlayerQuestDetails>;

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
      this.makeRequest(() => this.client.getQuestDetails(this.questId))
    );
  }

  async startQuest() {
    return this.updateQuest(
      this.makeRequest(() => this.client.startQuest(this.questId))
    );
  }

  async makeProgress(taskId: string, progressData: ProgressData) {
    return this.updateQuest(
      this.makeRequest(() =>
        this.client.makeProgress(this.questId, taskId, progressData)
      )
    );
  }

  async getCurrentStatePromise() {
    if (this.currentStatePromise) {
      return this.currentStatePromise;
    }
  }

  getCurrentState() {
    return this.currentState;
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

  private async updateQuest(
    responsePromise: Promise<ClientResponse<PlayerQuestDetails>>
  ) {
    this.currentStatePromise = responsePromise.then((it) => {
      if (it.ok) {
        return it.body;
      } else
        throw new Error(
          `Could not get quest state. Status: ${it.status}. Body: ${it.body}`
        );
    });

    const response = await responsePromise;
    if (response.ok) {
      this.currentState = response.body;
      this.entity.addComponentOrReplace(
        new QuestTrackingInfo(toRendererQuest(this.currentState))
      );
    }

    return response;
  }
}
