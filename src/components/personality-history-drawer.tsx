"use client";

import { useState, useMemo } from "react";
import { History, RotateCcw, GitCompare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PersonalityVersionDiff } from "@/components/personality-version-diff";
import {
  usePersonalityVersions,
  useRestorePersonalityVersion,
} from "@/hooks/use-personality-versions";
import type { PersonalitySelect, PersonalityVersionSelect } from "@/db/schema";

interface PersonalityHistoryDrawerProps {
  personality: PersonalitySelect;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function PersonalityHistoryDrawer({
  personality,
  userId,
  open,
  onOpenChange,
}: PersonalityHistoryDrawerProps) {
  const { data: versions = [], isLoading } = usePersonalityVersions(
    open ? personality.id : null
  );
  const restoreMutation = useRestorePersonalityVersion();

  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showDiff, setShowDiff] = useState(false);

  // Create a "current" version object from the personality
  const currentVersion: PersonalityVersionSelect = useMemo(
    () => ({
      id: "current",
      personalityId: personality.id,
      version: personality.version,
      name: personality.name,
      description: personality.description,
      traits: personality.traits,
      systemPrompt: personality.systemPrompt,
      color: personality.color,
      changeReason: null,
      createdAt: personality.updatedAt,
    }),
    [personality]
  );

  // Combine current with historical versions
  const allVersions = useMemo(
    () => [currentVersion, ...versions],
    [currentVersion, versions]
  );

  const toggleVersion = (versionId: string) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      }
      if (prev.length >= 2) {
        // Replace oldest selection
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      setShowDiff(true);
    }
  };

  const handleRestore = async (versionId: string) => {
    await restoreMutation.mutateAsync({
      personalityId: personality.id,
      versionId,
      userId,
    });
  };

  const handleBack = () => {
    setShowDiff(false);
    setSelectedVersions([]);
  };

  // Get selected version objects for diff
  const [oldVersion, newVersion] = useMemo(() => {
    if (selectedVersions.length !== 2) return [null, null];

    const v1 = allVersions.find((v) => v.id === selectedVersions[0]);
    const v2 = allVersions.find((v) => v.id === selectedVersions[1]);

    if (!v1 || !v2) return [null, null];

    // Order by version number (older first)
    return v1.version < v2.version ? [v1, v2] : [v2, v1];
  }, [selectedVersions, allVersions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            {showDiff ? "Compare Versions" : "Version History"}
            <Badge variant="secondary" className="ml-2">
              {personality.name}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {showDiff && oldVersion && newVersion ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                &larr; Back to History
              </Button>
              <div className="text-sm text-muted-foreground">
                v{oldVersion.version} &rarr; v{newVersion.version}
              </div>
            </div>
            <ScrollArea className="flex-1">
              <PersonalityVersionDiff
                oldVersion={oldVersion}
                newVersion={newVersion}
              />
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {selectedVersions.length > 0 && (
              <div className="flex items-center justify-between py-2 px-3 mb-3 rounded-md bg-secondary/50">
                <span className="text-sm text-muted-foreground">
                  {selectedVersions.length} version
                  {selectedVersions.length !== 1 ? "s" : ""} selected
                </span>
                <Button
                  size="sm"
                  onClick={handleCompare}
                  disabled={selectedVersions.length !== 2}
                >
                  <GitCompare className="h-3 w-3 mr-1.5" />
                  Compare
                </Button>
              </div>
            )}

            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading history...
                </div>
              ) : allVersions.length === 1 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No version history yet. Edit this personality to create
                  history.
                </div>
              ) : (
                <div className="space-y-2">
                  {allVersions.map((version, index) => {
                    const isCurrent = version.id === "current";
                    const isSelected = selectedVersions.includes(version.id);

                    return (
                      <div
                        key={version.id}
                        className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-secondary/30"
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleVersion(version.id)}
                          disabled={
                            !isSelected && selectedVersions.length >= 2
                          }
                          className="mt-0.5"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              Version {version.version}
                            </span>
                            {isCurrent && (
                              <Badge
                                variant="default"
                                className="text-[10px] px-1.5 py-0"
                              >
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(version.createdAt)}
                          </div>
                          {version.changeReason && (
                            <div className="text-xs text-muted-foreground mt-1 italic">
                              {version.changeReason}
                            </div>
                          )}
                          {index > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {version.name !== currentVersion.name && (
                                <span>Name: {version.name}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {!isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestore(version.id)}
                            disabled={restoreMutation.isPending}
                            className="shrink-0"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Restore
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
