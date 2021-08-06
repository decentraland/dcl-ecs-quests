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
  baseUrl?: string;
  clientFactory: (baseUrl: string) => QuestsClient;
  logErrors: boolean;
  addToEngine: boolean;
};

const defaultOptions = {
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
  private client?: QuestsClient;

  private currentState: QuestState | undefined;
  private currentStatePromise?: Promise<QuestState>;

  public entity: Entity;

  private readyListeners: ({ resolve: (client: QuestsClient) => any, reject: (reason: string) => any })[] = []
  private _ready: boolean = false

  constructor(private questId: string, options?: Partial<QuestTrackerOptions>) {
    this.options = {
      ...defaultOptions,
      ...(options ?? {}),
    };

    if (this.options.baseUrl) {
      this.setReady(this.options.clientFactory(this.options.baseUrl))
    } else if (getExplorerConfiguration) {
      getExplorerConfiguration().then((config) => {
        if (typeof config.configurations.questsServerUrl === "string") {
          this.options.baseUrl = config.configurations.questsServerUrl
          this.setReady(this.options.clientFactory(this.options.baseUrl))
        }
      }).catch(e => {
        this.readyListeners.forEach(it => it.reject(`Couldn't get configuration from explorer: ${e}`))
      });
    } else {
      throw new Error("Unsupported configuration for this explorer version! You need to provide baseUrl")
    }

    this.entity = new Entity()

    if (this.options.addToEngine) {
      engine.addEntity(this.entity)
    }

    this.refresh()
  }

  private setReady(client: QuestsClient) {
    this.client = client
    this._ready = true
    this.readyListeners.forEach(it => it.resolve(client))
    this.readyListeners = []
  }

  private async ready() {
    if (this._ready) return this.client!

    return new Promise<QuestsClient>((resolve, reject) => this.readyListeners.push({ resolve, reject }))
  }

  private async getClient() {
    if (this.client) return this.client

    return await this.ready()
  }

  async refresh() {
    return this.updateQuest(
      this.makeRequest(async () => (await this.getClient()).getQuestDetails(this.questId))
    );
  }

  async startQuest() {
    return this.updateQuest(
      this.makeRequest(async () => (await this.getClient()).startQuest(this.questId))
    );
  }

  async makeProgress(taskId: string, progressData: ProgressData) {
    return this.updateQuest(
      this.makeRequest(async () =>
        (await this.getClient()).makeProgress(this.questId, taskId, progressData)
      )
    );
  }

  async updateArbitraryState(changes: ArbitraryStateChange[]) {
    return this.updateQuest(
      this.makeRequest(async () =>
        (await this.getClient()).updateArbitraryState(this.questId, changes)
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
