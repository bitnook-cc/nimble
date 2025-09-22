"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileText,
  Package,
  Shield,
  Sparkles,
  Upload,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import { z } from "zod";

import { useState } from "react";

import { ActionAbilityDefinition, SpellAbilityDefinition } from "@/lib/schemas/abilities";
import { AncestryDefinition } from "@/lib/schemas/ancestry";
import { BackgroundDefinition } from "@/lib/schemas/background";
import { SpellSchoolDefinitionSchema } from "@/lib/schemas/class";
import { ClassDefinition, SubclassDefinition } from "@/lib/schemas/class";
import {
  ContentRepositoryService,
  ContentUploadResult,
  MultiFileUploadResult,
} from "@/lib/services/content-repository-service";
import {
  CustomContentType,
  getAllContentTypes,
  getContentTypeMetadata,
} from "@/lib/types/custom-content";
import { RepositoryItem } from "@/lib/types/item-repository";
import { ExampleGenerator } from "@/lib/utils/example-generator";
import {
  getAllSchemaDocumentation,
  getSchemaDocumentation,
} from "@/lib/utils/schema-documentation";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";

type SpellSchoolDefinition = z.infer<typeof SpellSchoolDefinitionSchema>;
type ContentItem =
  | ClassDefinition
  | SubclassDefinition
  | SpellSchoolDefinition
  | AncestryDefinition
  | BackgroundDefinition
  | ActionAbilityDefinition
  | SpellAbilityDefinition
  | RepositoryItem;

interface ContentManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContentManagementPanel({ isOpen, onClose }: ContentManagementPanelProps) {
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadDetails, setUploadDetails] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<
    Partial<Record<CustomContentType, boolean>>
  >({});
  const [showSchemaHelp, setShowSchemaHelp] = useState<Partial<Record<CustomContentType, boolean>>>(
    {},
  );

  const contentRepository = ContentRepositoryService.getInstance();
  const customContentStats = contentRepository.getCustomContentStats();

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    contentType: CustomContentType,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadMessage("");
    setUploadError("");

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let result: ContentUploadResult;

        switch (contentType) {
          case CustomContentType.CLASS_DEFINITION:
            result = contentRepository.uploadClasses(content);
            break;
          case CustomContentType.SUBCLASS_DEFINITION:
            result = contentRepository.uploadSubclasses(content);
            break;
          case CustomContentType.SPELL_SCHOOL_DEFINITION:
            result = contentRepository.uploadSpellSchools(content);
            break;
          case CustomContentType.ANCESTRY_DEFINITION:
            result = contentRepository.uploadAncestries(content);
            break;
          case CustomContentType.BACKGROUND_DEFINITION:
            result = contentRepository.uploadBackgrounds(content);
            break;
          case CustomContentType.ACTION_ABILITY:
            result = contentRepository.uploadAbilities(content);
            break;
          case CustomContentType.SPELL_ABILITY:
            result = contentRepository.uploadSpells(content);
            break;
          case CustomContentType.ITEM_REPOSITORY:
            result = contentRepository.uploadItems(content);
            break;
          default:
            result = { success: false, message: "Unknown content type" };
        }

        if (result.success) {
          setUploadMessage(result.message);
          setTimeout(() => setUploadMessage(""), 3000);
        } else {
          setUploadError(result.message);
          setTimeout(() => setUploadError(""), 5000);
        }
      } catch (error) {
        setUploadError("Invalid JSON file");
        setTimeout(() => setUploadError(""), 5000);
      }
    };
    reader.readAsText(file);

    // Clear the input so the same file can be uploaded again
    event.target.value = "";
  };

  const handleMultiFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploadMessage("");
    setUploadError("");
    setUploadDetails("");

    try {
      const result = await contentRepository.uploadMultipleFiles(files);
      
      if (result.success) {
        setUploadMessage(result.message);
        
        // Create detailed breakdown
        const successfulFiles = result.results.filter(r => r.result.success);
        if (successfulFiles.length > 0) {
          const details = successfulFiles.map(r => 
            `• ${r.filename}: ${r.result.message} ${r.contentType ? `(detected as ${r.contentType.replace('_', ' ').toLowerCase()})` : ''}`
          ).join('\n');
          setUploadDetails(details);
        }
        
        setTimeout(() => {
          setUploadMessage("");
          setUploadDetails("");
        }, 5000);
      } else {
        setUploadError(result.message);
        
        // Show detailed error breakdown
        const failedFiles = result.results.filter(r => !r.result.success);
        if (failedFiles.length > 0) {
          const details = failedFiles.map(r => 
            `• ${r.filename}: ${r.result.message}`
          ).join('\n');
          setUploadDetails(details);
        }
        
        setTimeout(() => {
          setUploadError("");
          setUploadDetails("");
        }, 8000);
      }
    } catch (error) {
      setUploadError("Failed to process files");
      setTimeout(() => setUploadError(""), 5000);
    }

    // Clear the input
    event.target.value = "";
  };

  const toggleSection = (section: CustomContentType) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleSchemaHelp = (contentType: CustomContentType) => {
    if (contentType) {
      setShowSchemaHelp((prev) => ({
        ...prev,
        [contentType]: !prev[contentType],
      }));
    }
  };

  const getContentForType = (contentType: CustomContentType): ContentItem[] => {
    switch (contentType) {
      case CustomContentType.CLASS_DEFINITION:
        return contentRepository.getAllClasses();
      case CustomContentType.SUBCLASS_DEFINITION:
        return contentRepository.getAllSubclasses();
      case CustomContentType.SPELL_SCHOOL_DEFINITION:
        return contentRepository.getAllSpellSchools();
      case CustomContentType.ANCESTRY_DEFINITION:
        return contentRepository.getAllAncestries();
      case CustomContentType.BACKGROUND_DEFINITION:
        return contentRepository.getAllBackgrounds();
      case CustomContentType.ACTION_ABILITY:
        return contentRepository.getAllActionAbilities();
      case CustomContentType.SPELL_ABILITY:
        return getAllSpells();
      case CustomContentType.ITEM_REPOSITORY:
        return contentRepository.getAllItems();
      default:
        return [];
    }
  };

  const getIconForType = (iconName: string) => {
    const iconProps = { className: "h-4 w-4" };
    switch (iconName) {
      case "Shield":
        return <Shield {...iconProps} />;
      case "Zap":
        return <Zap {...iconProps} />;
      case "Sparkles":
        return <Sparkles {...iconProps} />;
      case "Users":
        return <Users {...iconProps} />;
      case "FileText":
        return <FileText {...iconProps} />;
      case "Wand2":
        return <Wand2 {...iconProps} />;
      case "BookOpen":
        return <BookOpen {...iconProps} />;
      case "Package":
        return <Package {...iconProps} />;
      default:
        return <FileText {...iconProps} />;
    }
  };

  const getAllSpells = () => {
    // Get all spells from all schools plus loose custom spells
    const allSchools = contentRepository.getAllSpellSchools();
    const schoolSpells = allSchools.flatMap((school) =>
      contentRepository.getSpellsBySchool(school.id),
    );

    // Remove duplicates by ID
    const uniqueSpells = schoolSpells.filter(
      (spell, index, arr) => arr.findIndex((s) => s.id === spell.id) === index,
    );

    return uniqueSpells;
  };

  const exportContent = (item: ContentItem, contentType: CustomContentType) => {
    const metadata = getContentTypeMetadata(contentType);
    const itemId = "item" in item ? (item as RepositoryItem).item.id : (item as any).id;
    const filename = `${itemId}.json`;

    const jsonContent = JSON.stringify(item, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderContentSection = (contentType: CustomContentType, count: number) => {
    const metadata = getContentTypeMetadata(contentType);
    const items = getContentForType(contentType);
    const icon = getIconForType(metadata.icon);

    const isExpanded = expandedSections[contentType];

    return (
      <Card>
        <Collapsible open={isExpanded} onOpenChange={() => toggleSection(contentType)}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {icon}
                  {metadata.title}
                  <Badge
                    variant="secondary"
                    className={`text-white ${
                      contentType === CustomContentType.CLASS_DEFINITION
                        ? "bg-blue-600"
                        : contentType === CustomContentType.SUBCLASS_DEFINITION
                          ? "bg-green-600"
                          : contentType === CustomContentType.SPELL_SCHOOL_DEFINITION
                            ? "bg-purple-600"
                            : contentType === CustomContentType.ANCESTRY_DEFINITION
                              ? "bg-teal-600"
                              : contentType === CustomContentType.BACKGROUND_DEFINITION
                                ? "bg-indigo-600"
                                : contentType === CustomContentType.ACTION_ABILITY
                                  ? "bg-orange-600"
                                  : contentType === CustomContentType.SPELL_ABILITY
                                    ? "bg-red-600"
                                    : contentType === CustomContentType.ITEM_REPOSITORY
                                      ? "bg-yellow-600"
                                      : "bg-gray-600"
                    }`}
                  >
                    {count}
                  </Badge>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Schema Help Section */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">{metadata.title} Schema</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSchemaHelp(contentType)}
                    className="h-6 px-2"
                  >
                    <BookOpen className="h-3 w-3 mr-1" />
                    {showSchemaHelp[contentType] ? 'Hide' : 'Show'} Schema
                  </Button>
                </div>

                {(() => {
                  if (contentType && showSchemaHelp[contentType]) {
                    try {
                      const schema = getSchemaDocumentation(contentType);
                      const exampleJson = ExampleGenerator.generateExampleJSON(contentType);
                      const schemaString = JSON.stringify(schema, null, 2);

                      return (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs">
                          <div className="font-semibold text-blue-900 mb-1">
                            {schema.title || metadata.title} Format
                          </div>
                          {schema.description && (
                            <div className="text-blue-800 mb-2">{schema.description}</div>
                          )}

                          <details className="mt-2">
                            <summary className="font-medium text-blue-900 cursor-pointer">
                              Example JSON
                            </summary>
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(exampleJson || "");
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <pre className="mt-1 p-2 pr-10 bg-green-100 rounded overflow-x-auto text-xs">
                                {exampleJson || "Failed to generate example"}
                              </pre>
                            </div>
                          </details>

                          <details className="mt-2">
                            <summary className="font-medium text-blue-900 cursor-pointer">
                              JSON Schema
                            </summary>
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(schemaString);
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <pre className="mt-1 p-2 pr-10 bg-blue-100 rounded overflow-x-auto text-xs">
                                {schemaString}
                              </pre>
                            </div>
                          </details>

                          <div className="mt-2 flex items-center gap-1">
                            <a
                              href="https://json-editor.github.io/json-editor/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-700 hover:text-blue-900 flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Use JSON Editor for easier data creation
                            </a>
                          </div>
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  }
                  return null;
                })()}
              </div>

              {/* Content List */}
              {items.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Current {metadata.title}</Label>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {contentType === CustomContentType.ITEM_REPOSITORY
                      ? // Group items by category and type
                        Object.entries(
                          (items as any[]).reduce((groups: Record<string, any[]>, item) => {
                            const key = `${item.category}-${item.item.type}`;
                            const label = `${item.category} ${item.item.type}s`;
                            if (!groups[label]) groups[label] = [];
                            groups[label].push(item);
                            return groups;
                          }, {}),
                        ).map(([groupLabel, items]) => (
                          <div key={groupLabel} className="border rounded p-2">
                            <div className="font-medium text-sm text-yellow-600 mb-1">
                              {groupLabel} ({items.length} items)
                            </div>
                            <div className="space-y-1 ml-2">
                              {items.map((repoItem: any) => (
                                <div
                                  key={repoItem.item.id}
                                  className="flex items-start justify-between text-xs gap-2"
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium">{repoItem.item.name} <span className="text-muted-foreground font-normal">[{repoItem.item.id}]</span></span>
                                    <div className="text-muted-foreground">
                                      {repoItem.rarity && `${repoItem.rarity} • `}
                                      {repoItem.item.damage && `${repoItem.item.damage} • `}
                                      {repoItem.item.armor && `AC ${repoItem.item.armor}`}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 flex-shrink-0"
                                    onClick={() => exportContent(repoItem, contentType)}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      : contentType === CustomContentType.SPELL_ABILITY
                        ? // Group spells by school
                          Object.entries(
                            (items as SpellAbilityDefinition[]).reduce(
                              (groups: Record<string, SpellAbilityDefinition[]>, spell) => {
                                const school = spell.school || "Unknown";
                                if (!groups[school]) groups[school] = [];
                                groups[school].push(spell);
                                return groups;
                              },
                              {},
                            ),
                          ).map(([school, spells]) => (
                            <div key={school} className="border rounded p-2">
                              <div className="font-medium text-sm text-purple-600 mb-1">
                                {school} ({spells.length} spells)
                              </div>
                              <div className="space-y-1 ml-2">
                                {spells.map((spell) => (
                                  <div
                                    key={spell.id}
                                    className="flex items-start justify-between text-xs gap-2"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <span className="font-medium">{spell.name} <span className="text-muted-foreground font-normal">[{spell.id}]</span></span>
                                      {spell.tier && (
                                        <div className="text-muted-foreground">
                                          Tier {spell.tier}
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 flex-shrink-0"
                                      onClick={() => exportContent(spell, contentType)}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        : // Regular item display for non-spells
                          items.map((item, index) => {
                            // Handle repository items differently
                            if ("item" in item) {
                              const repositoryItem = item as RepositoryItem;
                              return (
                                <div
                                  key={repositoryItem.item.id || index}
                                  className="flex items-start justify-between p-2 border rounded gap-2"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">
                                      {repositoryItem.item.name} <span className="text-muted-foreground font-normal">[{repositoryItem.item.id}]</span>
                                    </div>
                                    {repositoryItem.item.description && (
                                      <div className="text-xs text-muted-foreground line-clamp-2">
                                        {repositoryItem.item.description}
                                      </div>
                                    )}
                                    <div className="text-xs text-muted-foreground">
                                      {repositoryItem.category} {repositoryItem.item.type}
                                      {repositoryItem.rarity && ` • ${repositoryItem.rarity}`}
                                      {repositoryItem.item.damage && ` • ${repositoryItem.item.damage}`}
                                      {repositoryItem.item.armor && ` • AC ${repositoryItem.item.armor}`}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 flex-shrink-0"
                                    onClick={() => exportContent(item, contentType)}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              );
                            }

                            // Handle other content types
                            const regularItem = item as Exclude<ContentItem, RepositoryItem>;
                            return (
                              <div
                                key={regularItem.id || index}
                                className="flex items-start justify-between p-2 border rounded gap-2"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm">{regularItem.name} <span className="text-muted-foreground font-normal">[{regularItem.id}]</span></div>
                                  {regularItem.description && (
                                    <div className="text-xs text-muted-foreground line-clamp-2">
                                      {regularItem.description}
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground space-x-2">
                                    {"spells" in regularItem && regularItem.spells && (
                                      <span>{regularItem.spells.length} spells</span>
                                    )}
                                    {"size" in regularItem &&
                                      (regularItem as AncestryDefinition).size && (
                                        <span>Size: {(regularItem as AncestryDefinition).size}</span>
                                      )}
                                    {"features" in regularItem &&
                                      (regularItem as AncestryDefinition | BackgroundDefinition)
                                        .features && (
                                        <span>
                                          {
                                            (regularItem as AncestryDefinition | BackgroundDefinition)
                                              .features.length
                                          }{" "}
                                          features
                                        </span>
                                      )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 flex-shrink-0"
                                  onClick={() => exportContent(item, contentType)}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No custom {metadata.title.toLowerCase()} uploaded yet
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Manage Content
          </DialogTitle>
          <DialogDescription>
            Upload and manage custom content for classes, ancestries, backgrounds, abilities, and
            spells.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Multi-File Upload Section */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Upload Content Files</h3>
                  <p className="text-sm text-muted-foreground">
                    Select multiple JSON files to upload. Files will be automatically detected and sorted by content type.
                  </p>
                </div>
                
                <div className="relative max-w-xs sm:max-w-md mx-auto">
                  <input
                    type="file"
                    accept=".json"
                    multiple
                    onChange={handleMultiFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="default" size="lg" className="w-full">
                    <Upload className="h-5 w-5 mr-2" />
                    Choose JSON Files
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Supported content types: Classes, Subclasses, Ancestries, Backgrounds, Abilities, Spells, Spell Schools, Items</div>
                  <div>You can upload different content types together in a single operation</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Messages */}
          {uploadMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              <div className="font-medium">{uploadMessage}</div>
              {uploadDetails && (
                <div className="mt-2 text-xs whitespace-pre-line">{uploadDetails}</div>
              )}
            </div>
          )}
          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              <div className="font-medium">{uploadError}</div>
              {uploadDetails && (
                <div className="mt-2 text-xs whitespace-pre-line">{uploadDetails}</div>
              )}
            </div>
          )}

          {/* Content Sections */}
          <div className="space-y-4">
            {getAllContentTypes().map((contentType) => {
              const count = customContentStats[contentType] || 0;
              return <div key={contentType}>{renderContentSection(contentType, count)}</div>;
            })}
          </div>

          {/* Help Section */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Upload Instructions:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Select JSON files containing properly formatted content definitions</li>
                  <li>Content will be validated before storage</li>
                  <li>Duplicate IDs will overwrite existing content</li>
                  <li>Custom content is stored locally in your browser</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
