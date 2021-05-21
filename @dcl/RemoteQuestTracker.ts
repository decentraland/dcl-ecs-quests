import {
  ClientResponse,
  QuestState,
  ProgressData,
  QuestsClient,
} from "dcl-quests-client/quests-client-amd";
import { signedFetch } from "@decentraland/SignedFetch";
import { QuestTrackingInfo } from "./component";
import { toRendererQuest } from "./mappings";
import { ArbitraryStateChange } from "node_modules/dcl-quests-client/index";
import { getExplorerConfiguration } from "@decentraland/EnvironmentAPI";

type QuestTrackerOptions = {
  baseUrl: string;
  clientFactory: (baseUrl: string) => QuestsClient;
  logErrors: boolean;
  addToEngine: boolean;
};

const defaultOptions = {
  baseUrl: "https://quests-api.decentraland.io",
  clientFactory: (baseUrl: string) =>
    new QuestsClient({
      baseUrl,
      fetchFn: signedFetch,
    }),
  logErrors: true,
  addToEngine: true,
};

export class RemoteQuestTracker {
  private options: QuestTrackerOptions;
  private client: QuestsClient;

  private currentState: QuestState | undefined;
  private currentStatePromise?: Promise<QuestState>;

  public entity: Entity;

  constructor(private questId: string, options?: Partial<QuestTrackerOptions>) {
    this.options = {
      ...defaultOptions,
      ...(options ?? {}),
    };

    this.client = this.options.clientFactory(this.options.baseUrl);

    if (getExplorerConfiguration) {
      getExplorerConfiguration().then((config) => {
        if (typeof config.configurations.questsServerUrl === "string") {
          this.options.baseUrl = config.configurations.questsServerUrl;
          this.client = this.options.clientFactory(this.options.baseUrl);
        }
      });
    }

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

  async updateArbitraryState(changes: ArbitraryStateChange[]) {
    return this.updateQuest(
      this.makeRequest(() =>
        this.client.updateArbitraryState(this.questId, changes)
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
    responsePromise: Promise<ClientResponse<QuestState>>
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
      const component = this.entity.getComponentOrNull(QuestTrackingInfo);
      if (component) {
        component.questData = toRendererQuest(this.currentState);
      } else {
        this.entity.addComponent(
          new QuestTrackingInfo(toRendererQuest(this.currentState))
        );
      }
    }

    return response;
  }
}
