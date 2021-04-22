import {
  PlayerGivenReward,
  ProgressStatus,
  ProgressSummary,
  QuestState,
} from "dcl-quests-client/quests-client-amd";

export interface QuestStateQuery {
  getTaskStatus(taskId: string): ProgressStatus | undefined;
  getStepStatus(stepId: string): ProgressStatus | undefined;
  isTaskCompleted(taskId: string): boolean;
  isStepCompleted(stepId: string): boolean;

  getTaskProgress(taskId: string): ProgressSummary | undefined;
  getAllGivenRewards(): PlayerGivenReward[];
}

function find<T>(array: T[], criteria: (t: T) => boolean): T | undefined {
  for (const it of array) {
    if (criteria(it)) return it;
  }

  return;
}

function flatMap<T, U>(array: T[], mapping: (t: T) => U[]): U[] {
  return array
    .map(mapping)
    .reduce((list, toAppend) => list.concat(toAppend), []);
}

export function query(state: QuestState): QuestStateQuery {
  return new (class implements QuestStateQuery {
    getTaskStatus(taskId: string): ProgressStatus | undefined {
      return find(state.tasks, (it) => it.id === taskId)?.progressStatus;
    }

    getStepStatus(stepId: string): ProgressStatus | undefined {
      return find(
        flatMap(state.tasks, (task) => task.steps),
        (step) => step.id === stepId
      )?.progressStatus;
    }

    isTaskCompleted(taskId: string): boolean {
      return this.getTaskStatus(taskId) === ProgressStatus.COMPLETED;
    }

    isStepCompleted(stepId: string): boolean {
      return this.getStepStatus(stepId) === ProgressStatus.COMPLETED;
    }

    getTaskProgress(taskId: string): ProgressSummary | undefined {
      return find(state.tasks, (it) => it.id === taskId)?.progressSummary;
    }

    getAllGivenRewards(): PlayerGivenReward[] {
      return [
        ...state.givenRewards,
        ...flatMap(state.tasks, (it) => it.givenRewards),
      ];
    }
  })();
}
