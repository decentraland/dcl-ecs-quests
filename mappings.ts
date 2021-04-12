import { TaskState } from "dcl-quests-client/quests-client-amd";
import { QuestForRenderer, SectionForRenderer, TaskForRenderer } from "./types";

export function toRendererQuest(serverDetails: any): QuestForRenderer {
  return {
    id: serverDetails.id,
    name: serverDetails.name,
    description: serverDetails.description,
    icon: serverDetails.icon,
    thumbnail_banner: serverDetails.thumbnailBanner,
    thumbnail_entry: serverDetails.thumbnailEntry,
    status: serverDetails.progressStatus,
    sections: toRendererSections(serverDetails.tasks),
  };
}

function toRendererSections(tasks: any[]): SectionForRenderer[] {
  const sectionsMap = tasks.reduce<Record<string, SectionForRenderer>>(
    (currentMap, task) => {
      const sectionName = task.section ?? "";
      const section = currentMap[sectionName] ?? {
        id: sectionName,
        name: sectionName,
        progress: 0,
        tasks: [],
      };

      section.tasks.push(toRendererTask(task));

      currentMap[sectionName] = section;
      return currentMap;
    },
    {}
  );

  const sections: SectionForRenderer[] = [];

  for (const sectionName in sectionsMap) {
    const section = sectionsMap[sectionName];

    section.progress =
      section.tasks.length > 0
        ? section.tasks.reduce((a, b) => a + b.progress, 0) /
          section.tasks.length
        : 0;

    sections.push(section);
  }

  return sections;
}

function toRendererTask(task: any): TaskForRenderer {
  return {
    id: task.id,
    progress: task.progressPercentage,
    name: task.description,
    coordinates: task.coordinates,
    payload: JSON.stringify(getProgressPayload(task)),
    status: task.progressStatus,
    type: task.progressMode.type,
  };
}

function getProgressPayload(task: TaskState) {
  const progressMode = task.progressMode;
  switch (progressMode.type) {
    case "single":
      return { isDone: task.progressStatus === "completed" };
    default:
      // We "disguise" step-based as numeric too. We have the information in progress summary
      return {
        type: "numeric",
        start: task.progressSummary.start,
        end: task.progressSummary.end,
        current: task.progressSummary.current,
      };
  }
}
