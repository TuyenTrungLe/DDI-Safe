import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import useAuthStore, { type DrugInCabinet, type InteractionCheckRecord } from "@/stores/use-auth-store";
// No need to import drugInteractionAPI directly anymore because only the list API is used.
import { User, LogOut, Plus, X, AlertTriangle, Activity, History, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// No separate interface is needed here because we use DrugInCabinet directly.

export function PatientProfile() {
  const {
    user,
    logout,
    updateProfile,
    fetchMedicineCabinet,
    fetchInteractionHistory,
    removeDrugFromCabinet,
    addToMedicineCabinet,
    clearInteractionHistory,
  } = useAuthStore();
  const [isLoadingCabinet, setIsLoadingCabinet] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingCabinet, setIsEditingCabinet] = useState(false);
  const [newMedication, setNewMedication] = useState("");
  // No separate interaction state is needed here; we use user.personalMedicineCabinet directly.

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    dateOfBirth: user?.dateOfBirth || "",
    gender: user?.gender || "",
    address: user?.address || "",
  });

  const [cabinetData, setCabinetData] = useState<DrugInCabinet[]>(() => {
    const drugs = user?.personalMedicineCabinet || [];
    return Array.isArray(drugs) ? drugs.map((d) => (typeof d === "string" ? { drug_name: d } : d)) : [];
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth || "",
        gender: user.gender || "",
        address: user.address || "",
      });
      const drugs = user.personalMedicineCabinet || [];
      setCabinetData(Array.isArray(drugs) ? drugs.map((d) => (typeof d === "string" ? { drug_name: d } : d)) : []);
    }
  }, [user]);

  // Fetch the medicine cabinet when the user changes (only once)
  useEffect(() => {
    if (user?.id) {
      fetchMedicineCabinet();
      fetchInteractionHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Check whether a drug has actual interactions, not just "no interaction" messages.
  const hasActualInteractions = (interactions?: string): boolean => {
    if (!interactions || interactions.trim().length === 0) return false;

    // Parse interactions and check if any are real interactions
    const pairs = parseInteractions(interactions);
    return pairs.length > 0;
  };

  // Parse the interaction string to extract drug pairs and filter out safe entries.
  const parseInteractions = (interactions: string): Array<{ drug1: string; drug2: string; details: string }> => {
    const pairs: Array<{ drug1: string; drug2: string; details: string }> = [];
    const parts = interactions
      .split("|")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    parts.forEach((part) => {
      // Try to extract drug names from interaction text.
      // Pattern: "Interaction between X and Y: ..."
      const match = part.match(/(?:Interaction between|Tương tác giữa)\s+(.+?)\s+(?:and|và)\s+([^:]+?):\s*(.+)/i);
      if (match) {
        const drug1 = match[1].trim();
        const drug2 = match[2].trim();
        const details = match[3].trim();

        // Filter out interactions that indicate no interaction.
        const lowerDetails = details.toLowerCase();
        const isNoInteraction =
          lowerDetails.includes("no significant interaction") ||
          lowerDetails.includes("no interaction found") ||
          lowerDetails.includes("no interaction") ||
          lowerDetails.includes("safe") ||
          lowerDetails.includes("không có tương tác") ||
          lowerDetails.includes("không tìm thấy tương tác") ||
          lowerDetails.includes("không có tương tác nào");

        if (!isNoInteraction) {
          pairs.push({ drug1, drug2, details });
        }
      }
    });

    return pairs;
  };

  // Normalize drug name for comparison (lowercase, trim)
  const normalizeDrugName = (name: string): string => {
    return name.toLowerCase().trim();
  };

  // Check if two drug names match (case-insensitive)
  const drugNamesMatch = (name1: string, name2: string): boolean => {
    return normalizeDrugName(name1) === normalizeDrugName(name2);
  };

  const parseApiDateTime = (value: string): Date => {
    const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(value.trim());
    return new Date(hasTimezone ? value : `${value}Z`);
  };

  const formatDateTime = (value?: string | null): string => {
    if (!value) return "Not checked yet";
    const date = parseApiDateTime(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isSafeRisk = (risk?: string | null): boolean => {
    if (!risk) return true;
    const normalizedRisk = risk.trim().toLowerCase();
    return ["none", "low", "safe", "khong"].some((safe) => normalizedRisk.includes(safe));
  };

  const extractAnswerSummary = (text?: string): string | null => {
    if (!text) return null;

    const finalSummary = text.match(/###\s*Final Summary\s*\n([\s\S]*?)(?=\n###|$)/i);
    if (finalSummary?.[1]?.trim()) {
      return finalSummary[1].trim();
    }

    const overallRisk = text.match(/\*\*Overall Risk:\*\*[\s\S]*?(?=\n###|\n####|$)/i);
    if (overallRisk?.[0]?.trim()) {
      return overallRisk[0].trim();
    }

    return null;
  };

  const extractOverallRiskFromText = (text?: string | null): string | null => {
    if (!text) return null;
    const match = text.match(/\*{0,2}\s*Overall Risk\s*\*{0,2}\s*:\s*\*{0,2}\s*([^\n\r*]+)/i);
    return match?.[1]?.trim().replace(/[.:-]+$/, "").trim() || null;
  };

  const getRecordResultAnswer = (record: InteractionCheckRecord): string => {
    const result = record.result;
    if (typeof result === "string") return result;
    if (result && typeof result === "object" && "answer" in result) {
      return String((result as { answer?: unknown }).answer || "");
    }
    return "";
  };

  const getRecordRisk = (record: InteractionCheckRecord): string => {
    const answerRisk = extractOverallRiskFromText(getRecordResultAnswer(record));
    if (answerRisk && !isSafeRisk(answerRisk)) {
      return answerRisk;
    }

    const summaryRisk = extractOverallRiskFromText(record.result_summary || record.summary || "");
    if (summaryRisk) {
      return summaryRisk;
    }

    return record.overall_risk || "Unknown";
  };

  const getRecordSummary = (record: InteractionCheckRecord): string => {
    const answerSummary = extractAnswerSummary(getRecordResultAnswer(record));
    const answerRisk = extractOverallRiskFromText(answerSummary);
    if (answerSummary && answerRisk && !isSafeRisk(answerRisk)) {
      return answerSummary;
    }

    return record.result_summary || record.summary || answerSummary || "No summary saved";
  };

  const historyRecords = user?.interactionHistory || [];
  const cabinetStats = user?.medicineCabinetStats || {
    total_saved_drugs: user?.personalMedicineCabinet?.length || 0,
    total_checks: historyRecords.length,
    total_interaction_alerts: historyRecords.reduce((sum, record) => sum + (record.interactions_found || 0), 0),
    high_risk_checks: historyRecords.filter((record) => {
      const risk = getRecordRisk(record);
      return risk !== "Unknown" && !isSafeRisk(risk);
    }).length,
    last_checked_at: historyRecords[0]?.checked_at || historyRecords[0]?.timestamp || null,
    most_checked_drugs: [],
  };

  const getRecordDrugs = (record: (typeof historyRecords)[number]): string[] => {
    return record.checked_drugs || record.drugs || [];
  };

  const getRecordTime = (record: (typeof historyRecords)[number]): string => {
    return record.checked_at || record.timestamp;
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Clear all saved interaction check history?")) return;

    setIsLoadingHistory(true);
    try {
      await clearInteractionHistory();
      toast.success("Interaction check history cleared.");
    } catch (error) {
      console.error("Error clearing interaction history:", error);
      toast.error("Unable to clear interaction check history.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Get all interaction pairs grouped by drug
  const getGroupedInteractions = (): Record<string, Array<{ drug2: string; details: string }>> => {
    if (!user?.personalMedicineCabinet) return {};

    const grouped: Record<string, Array<{ drug2: string; details: string }>> = {};

    user.personalMedicineCabinet.forEach((drug) => {
      const drugObj = typeof drug === "string" ? { drug_name: drug } : drug;
      if (drugObj.interactions) {
        // Parse and filter interactions - parseInteractions already filters out safe entries.
        const pairs = parseInteractions(drugObj.interactions);

        // Only add to grouped if there are actual interactions
        if (pairs.length > 0) {
          pairs.forEach((pair) => {
            // Use the source drug as the key.
            if (!grouped[drugObj.drug_name]) {
              grouped[drugObj.drug_name] = [];
            }

            // Find the other drug (not the source) using case-insensitive matching.
            let otherDrug: string;
            if (drugNamesMatch(pair.drug1, drugObj.drug_name)) {
              otherDrug = pair.drug2;
            } else if (drugNamesMatch(pair.drug2, drugObj.drug_name)) {
              otherDrug = pair.drug1;
            } else {
              // If neither matches exactly, check if one is a partial match or use the first one.
              // This handles slight naming variations.
              otherDrug = drugNamesMatch(pair.drug1, drugObj.drug_name) ? pair.drug2 : pair.drug1;
            }

            // Only add if we found a valid other drug
            if (otherDrug) {
              grouped[drugObj.drug_name].push({ drug2: otherDrug, details: pair.details });
            }
          });
        }
      }
    });

    return grouped;
  };

  const handleSave = () => {
    updateProfile({
      ...formData,
      gender: formData.gender as "male" | "female" | "other" | undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      dateOfBirth: user?.dateOfBirth || "",
      gender: user?.gender || "",
      address: user?.address || "",
    });
    setIsEditing(false);
  };

  const handleSaveCabinet = async () => {
    setIsLoadingCabinet(true);
    try {
      // Get current drugs from user
      const currentDrugs = user?.personalMedicineCabinet || [];
      const currentDrugNames = currentDrugs.map((d) => (typeof d === "string" ? d : d.drug_name));
      const newDrugNames = cabinetData.map((d) => d.drug_name);

      const newDrugs = newDrugNames.filter((drug) => !currentDrugNames.includes(drug));
      const removedDrugs = currentDrugNames.filter((drug) => !newDrugNames.includes(drug));

      // Remove drugs that were deleted
      for (const drug of removedDrugs) {
        try {
          await removeDrugFromCabinet(drug);
        } catch (error) {
          console.error(`Error removing drug ${drug}:`, error);
        }
      }

      // Add new drugs
      if (newDrugs.length > 0) {
        await addToMedicineCabinet(newDrugs);
      }

      // Refresh from API
      await fetchMedicineCabinet();
      setIsEditingCabinet(false);
      toast.success("Medicine cabinet updated successfully!");
    } catch (error) {
      console.error("Error saving medicine cabinet:", error);
      toast.error("An error occurred while updating the medicine cabinet.");
    } finally {
      setIsLoadingCabinet(false);
    }
  };

  const handleCancelCabinet = () => {
    const drugs = user?.personalMedicineCabinet || [];
    setCabinetData(Array.isArray(drugs) ? drugs.map((d) => (typeof d === "string" ? { drug_name: d } : d)) : []);
    setIsEditingCabinet(false);
  };

  const addMedication = () => {
    if (newMedication.trim()) {
      setCabinetData([...cabinetData, { drug_name: newMedication.trim() }]);
      setNewMedication("");
    }
  };

  const removeMedication = (index: number) => {
    setCabinetData(cabinetData.filter((_, i) => i !== index));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px] mx-auto">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Please sign in to view your medicine cabinet</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-5xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Personal Medicine Cabinet</CardTitle>
              <CardDescription>Manage your personal information and medicine cabinet</CardDescription>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="cabinet">Medicine Cabinet</TabsTrigger>
              <TabsTrigger value="history">Check History</TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-6 mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  ) : (
                    <p className="text-sm font-medium">{user.name || "Not updated"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  ) : (
                    <p className="text-sm font-medium">{user.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0123456789"
                    />
                  ) : (
                    <p className="text-sm font-medium">{user.phone || "Not updated"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("en-US") : "Not updated"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  {isEditing ? (
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium">
                      {user.gender === "male" ? "Male" : user.gender === "female" ? "Female" : user.gender === "other" ? "Other" : "Not updated"}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                {isEditing ? (
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter your address"
                    rows={3}
                  />
                ) : (
                    <p className="text-sm font-medium">{user.address || "Not updated"}</p>
                )}
              </div>

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                )}
              </div>
            </TabsContent>

            {/* Medicine Cabinet Tab */}
            <TabsContent value="cabinet" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      Saved Drugs
                    </div>
                    <p className="mt-2 text-2xl font-semibold">{cabinetStats.total_saved_drugs}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <History className="h-4 w-4" />
                      Total Checks
                    </div>
                    <p className="mt-2 text-2xl font-semibold">{cabinetStats.total_checks}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShieldAlert className="h-4 w-4" />
                      Alerts
                    </div>
                    <p className="mt-2 text-2xl font-semibold">{cabinetStats.total_interaction_alerts}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="h-4 w-4" />
                      High Risk Checks
                    </div>
                    <p className="mt-2 text-2xl font-semibold">{cabinetStats.high_risk_checks}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Medicine Cabinet</Label>
                  <p className="text-sm text-muted-foreground">
                    A list of drug ingredients you have used. You can enter them manually or save them from interaction checks.
                  </p>
                </div>

                {isEditingCabinet ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newMedication}
                        onChange={(e) => setNewMedication(e.target.value)}
                        placeholder="Enter drug name"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMedication())}
                      />
                      <Button type="button" size="icon" onClick={addMedication}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cabinetData.map((med, index) => {
                        const drugObj = typeof med === "string" ? { drug_name: med } : med;
                        const hasInteractions = hasActualInteractions(drugObj.interactions);
                        return (
                          <Badge
                            key={index}
                            variant={hasInteractions ? "destructive" : "secondary"}
                            className={`flex items-center gap-1 ${hasInteractions ? "bg-destructive text-destructive-foreground" : ""}`}
                          >
                            {drugObj.drug_name}
                            {hasInteractions && <AlertTriangle className="h-3 w-3" />}
                            <button type="button" onClick={() => removeMedication(index)} className="ml-1 hover:bg-destructive/20 rounded-full p-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveCabinet} disabled={isLoadingCabinet}>
                        {isLoadingCabinet ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                            "Save Changes"
                        )}
                      </Button>
                        <Button variant="outline" onClick={handleCancelCabinet} disabled={isLoadingCabinet}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {user.personalMedicineCabinet && user.personalMedicineCabinet.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.personalMedicineCabinet.map((med, index) => {
                          const drugName = typeof med === "string" ? med : med.drug_name;
                          const interactions = typeof med === "string" ? undefined : med.interactions;
                          const hasInteractions = hasActualInteractions(interactions);
                          return (
                            <Badge
                              key={index}
                              variant={hasInteractions ? "destructive" : "secondary"}
                              className={`text-sm px-3 py-1.5 ${hasInteractions ? "bg-destructive text-destructive-foreground" : ""}`}
                            >
                              {drugName}
                              {hasInteractions && <AlertTriangle className="h-3 w-3 ml-1" />}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground border rounded-lg">
                        <p>No drugs in your medicine cabinet yet</p>
                        <p className="text-sm mt-2">Add drugs manually or save them from interaction check results</p>
                      </div>
                    )}
                    <Button onClick={() => setIsEditingCabinet(true)}>Edit Cabinet</Button>
                  </div>
                )}

                {/* Interactions Table */}
                {(() => {
                  const groupedInteractions = getGroupedInteractions();
                  const hasInteractions = Object.keys(groupedInteractions).length > 0;

                  return hasInteractions ? (
                    <div className="space-y-4 mt-6 pt-6 border-t">
                      <div className="space-y-2">
                        <Label>Drug Interactions</Label>
                        <p className="text-sm text-muted-foreground">Interaction table for drug pairs in your medicine cabinet</p>
                      </div>

                      <div className="space-y-4">
                        {Object.entries(groupedInteractions).map(([drug, interactions]) => (
                          <Card key={drug} className="border-2">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                {drug}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="border rounded-lg overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Interacting Drug</TableHead>
                                      <TableHead>Details</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {interactions.map((interaction, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell className="font-medium">{interaction.drug2}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground whitespace-pre-wrap">{interaction.details}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </TabsContent>

            {/* Interaction Check History Tab */}
            <TabsContent value="history" className="space-y-6 mt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <Label>Interaction Check History</Label>
                  <p className="text-sm text-muted-foreground">
                    Saved results from previous interaction checks. Results are stored by check session, not by individual drug.
                  </p>
                  <p className="text-sm text-muted-foreground">Last checked: {formatDateTime(cabinetStats.last_checked_at)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleClearHistory} disabled={isLoadingHistory || historyRecords.length === 0}>
                  {isLoadingHistory ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Clear History
                </Button>
              </div>

              {(cabinetStats.most_checked_drugs || []).length > 0 && (
                <div className="space-y-2">
                  <Label>Most Checked Drugs</Label>
                  <div className="flex flex-wrap gap-2">
                    {(cabinetStats.most_checked_drugs || []).map((drug) => (
                      <Badge key={drug.drug_name} variant="secondary" className="text-sm px-3 py-1.5">
                        {drug.drug_name} ({drug.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {historyRecords.length > 0 ? (
                <div className="space-y-4">
                  {historyRecords.map((record) => {
                    const risk = getRecordRisk(record);
                    const isRisky = risk !== "Unknown" && !isSafeRisk(risk);
                    const drugs = getRecordDrugs(record);

                    return (
                      <div key={record.id} className="rounded-lg border bg-background">
                        <div className="flex flex-col gap-3 border-b bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{formatDateTime(getRecordTime(record))}</p>
                            <p className="text-xs text-muted-foreground">{drugs.length} drug ingredient{drugs.length === 1 ? "" : "s"} checked</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={isRisky ? "destructive" : "secondary"}>{risk}</Badge>
                            <Badge variant="outline">{record.interactions_found || 0} alert{(record.interactions_found || 0) === 1 ? "" : "s"}</Badge>
                          </div>
                        </div>

                        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(180px,260px)_1fr]">
                          <div className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Drugs</p>
                            <div className="flex flex-wrap gap-1.5">
                              {drugs.map((drug) => (
                                <Badge key={`${record.id}-${drug}`} variant="secondary">
                                  {drug}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Result Summary</p>
                            <div className="max-h-72 overflow-auto rounded-md border bg-muted/10 px-4 py-3">
                              <div className="text-sm leading-6 text-foreground">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                                    ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
                                    ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
                                    li: ({ children }) => <li className="pl-1">{children}</li>,
                                    h1: ({ children }) => <h1 className="mb-2 text-base font-semibold">{children}</h1>,
                                    h2: ({ children }) => <h2 className="mb-2 text-base font-semibold">{children}</h2>,
                                    h3: ({ children }) => <h3 className="mb-2 text-sm font-semibold">{children}</h3>,
                                    em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                                  }}
                                >
                                  {getRecordSummary(record)}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  <History className="h-8 w-8 mx-auto mb-3" />
                  <p>No interaction checks saved yet</p>
                  <p className="text-sm mt-2">Run an interaction check while signed in to save its result here.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
