import { QuestForRenderer } from "./types";

// A randomly generated int32
const CLASS_ID = 1417815519;

/**
 * Holds the information of a quest
 * @public
 */
@Component("engine.questTrackingComponent", CLASS_ID)
export class QuestTrackingInfo {
  constructor(public questData: QuestForRenderer) {}

  toJSON() {
    return this.questData;
  }
}