"use client";

import { useMemo } from "react";
import { parseDiff, Diff, Hunk } from "react-diff-view";
import { formatLines, diffLines } from "unidiff";
import { Badge } from "@/components/ui/badge";
import type { PersonalityVersionSelect } from "@/db/schema";

interface PersonalityVersionDiffProps {
  oldVersion: PersonalityVersionSelect;
  newVersion: PersonalityVersionSelect;
}

function createDiffText(oldText: string, newText: string, name: string) {
  if (oldText === newText) return null;

  const diffText = formatLines(diffLines(oldText, newText), { context: 3 });
  if (!diffText.trim()) return null;

  // Add git header for react-diff-view
  const fullDiff = `diff --git a/${name} b/${name}
index 0000000..1111111 100644
${diffText}`;

  try {
    const [diff] = parseDiff(fullDiff, { nearbySequences: "zip" });
    return diff;
  } catch {
    return null;
  }
}

function TraitsComparison({
  oldTraits,
  newTraits,
}: {
  oldTraits: string[];
  newTraits: string[];
}) {
  const removed = oldTraits.filter((t) => !newTraits.includes(t));
  const added = newTraits.filter((t) => !oldTraits.includes(t));
  const unchanged = oldTraits.filter((t) => newTraits.includes(t));

  if (removed.length === 0 && added.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Traits</h4>
      <div className="flex flex-wrap gap-1.5">
        {unchanged.map((trait) => (
          <Badge key={trait} variant="secondary" className="text-xs">
            {trait}
          </Badge>
        ))}
        {removed.map((trait) => (
          <Badge
            key={`removed-${trait}`}
            variant="outline"
            className="text-xs bg-destructive/10 text-destructive border-destructive/20 line-through"
          >
            {trait}
          </Badge>
        ))}
        {added.map((trait) => (
          <Badge
            key={`added-${trait}`}
            variant="outline"
            className="text-xs bg-chart-2/10 text-chart-2 border-chart-2/20"
          >
            + {trait}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function MetadataChanges({
  label,
  oldValue,
  newValue,
}: {
  label: string;
  oldValue: string;
  newValue: string;
}) {
  if (oldValue === newValue) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span className="line-through text-destructive/70">{oldValue}</span>
      <span className="text-muted-foreground">&rarr;</span>
      <span className="text-chart-2">{newValue}</span>
    </div>
  );
}

export function PersonalityVersionDiff({
  oldVersion,
  newVersion,
}: PersonalityVersionDiffProps) {
  const systemPromptDiff = useMemo(
    () =>
      createDiffText(
        oldVersion.systemPrompt || "",
        newVersion.systemPrompt || "",
        "system-prompt"
      ),
    [oldVersion.systemPrompt, newVersion.systemPrompt]
  );

  const descriptionDiff = useMemo(
    () =>
      createDiffText(
        oldVersion.description,
        newVersion.description,
        "description"
      ),
    [oldVersion.description, newVersion.description]
  );

  const hasNameChange = oldVersion.name !== newVersion.name;
  const hasColorChange = oldVersion.color !== newVersion.color;
  const hasTraitsChange =
    JSON.stringify(oldVersion.traits) !== JSON.stringify(newVersion.traits);
  const hasAnyChange =
    systemPromptDiff ||
    descriptionDiff ||
    hasNameChange ||
    hasColorChange ||
    hasTraitsChange;

  if (!hasAnyChange) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No differences between these versions
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metadata changes */}
      {(hasNameChange || hasColorChange) && (
        <div className="space-y-2 p-3 rounded-md bg-secondary/30">
          <h4 className="text-sm font-medium text-muted-foreground">
            Metadata Changes
          </h4>
          <MetadataChanges
            label="Name"
            oldValue={oldVersion.name}
            newValue={newVersion.name}
          />
          <MetadataChanges
            label="Color"
            oldValue={oldVersion.color}
            newValue={newVersion.color}
          />
        </div>
      )}

      {/* Traits comparison */}
      {hasTraitsChange && (
        <div className="p-3 rounded-md bg-secondary/30">
          <TraitsComparison
            oldTraits={oldVersion.traits}
            newTraits={newVersion.traits}
          />
        </div>
      )}

      {/* Description diff */}
      {descriptionDiff && descriptionDiff.hunks?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Description
          </h4>
          <div className="rounded-md overflow-hidden border border-border text-xs">
            <Diff viewType="unified" diffType={descriptionDiff.type} hunks={descriptionDiff.hunks}>
              {(hunks) =>
                hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
              }
            </Diff>
          </div>
        </div>
      )}

      {/* System prompt diff */}
      {systemPromptDiff && systemPromptDiff.hunks?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            System Prompt
          </h4>
          <div className="rounded-md overflow-hidden border border-border text-xs">
            <Diff viewType="unified" diffType={systemPromptDiff.type} hunks={systemPromptDiff.hunks}>
              {(hunks) =>
                hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
              }
            </Diff>
          </div>
        </div>
      )}
    </div>
  );
}
