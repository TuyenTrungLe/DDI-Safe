import { AlertTriangle, CheckCircle, Info, ExternalLink } from "lucide-react";
import { Alert, AlertTitle } from "./ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DrugReference {
  name: string;
  link: string;
}

interface DrugConversion {
  original: string;
  converted: string;
  reference?: DrugReference;
}

interface DrugInteraction {
  drug1: string;
  drug2: string;
  details: string;
  hasInteraction: boolean;
  reference1?: DrugReference;
  reference2?: DrugReference;
}

interface ParsedResult {
  drug_conversion?: DrugConversion[];
  interactions?: Array<{
    drug1: string;
    drug2: string;
    status: string;
    details: string;
    reference1?: DrugReference;
    reference2?: DrugReference;
  }>;
  summary?: {
    overall_risk?: string;
    major_interactions?: string[];
    recommendations?: string[];
  };
}

interface ResponseData {
  answer?: string;
  parsed_result?: ParsedResult;
  drug_links?: Record<string, string>;
}

interface InteractionResultsProps {
  result: string | ResponseData;
  isLoading: boolean;
}

// Parse drug name conversions from markdown
function parseDrugConversions(text: string): DrugConversion[] {
  const conversions: DrugConversion[] = [];
  const conversionSection = text.match(/### (?:Drug Name Conversions|ChuyÃ¡Â»Æ’n Ã„ÂÃ¡Â»â€¢i TÃƒÂªn ThuÃ¡Â»â€˜c)\n([\s\S]*?)(?=\n###|$)/);

  if (conversionSection) {
    const lines = conversionSection[1].split("\n").filter((line) => line.trim().startsWith("-"));
    lines.forEach((line) => {
      // Match pattern: - Original Ã¢â€ â€™ Converted1 Ã¢â€ â€™ Converted2 (etc)
      const match = line.match(/- (.+?)( Ã¢â€ â€™ .+)+$/);
      if (match) {
        const parts = line.replace(/^-\s*/, "").split(" Ã¢â€ â€™ ");
        if (parts.length >= 2) {
          conversions.push({
            original: parts[0].trim(),
            converted: parts[parts.length - 1].trim(), // Take the last converted name
          });
        }
      }
    });
  }

  return conversions;
}

// Parse drug interactions from markdown
function parseDrugInteractions(text: string): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];
  const interactionSection = text.match(/### (?:Interactions Between Drug Pairs|TÃ†Â°Ã†Â¡ng TÃƒÂ¡c GiÃ¡Â»Â¯a CÃƒÂ¡c CÃ¡ÂºÂ·p ThuÃ¡Â»â€˜c)\n([\s\S]*?)(?=\n---|$)/);

  if (interactionSection) {
    const pairs = interactionSection[1].split(/\n#### /).filter((pair) => pair.trim());

    pairs.forEach((pair) => {
      // Match: Drug1 + Drug2 followed by newline
      const drugMatch = pair.match(/^(.+?)\s+\+\s+(.+?)(?:\n|$)/);
      if (drugMatch) {
        const drug1 = drugMatch[1].trim();
        const drug2 = drugMatch[2].trim();
        // Match: **Chi tiÃ¡ÂºÂ¿t tÃ†Â°Ã†Â¡ng tÃƒÂ¡c:** or **Chi tiÃ¡ÂºÂ¿t TÃ†Â°Ã†Â¡ng TÃƒÂ¡c:** (case insensitive) followed by details
        const detailsMatch = pair.match(/\*\*(?:Interaction Details|Chi tiÃ¡ÂºÂ¿t [Tt]Ã†Â°Ã†Â¡ng [Tt]ÃƒÂ¡c):\*\*\s*(.+?)(?=\n\n|\n#### |$)/s);
        const details = detailsMatch ? detailsMatch[1].trim() : "";

        // Determine if there's an interaction:
        // - If details is empty, assume no interaction (safe)
        // - If details contains phrases indicating no interaction, no interaction
        // - Otherwise, if there's actual content describing an interaction, there's an interaction
        const lowerDetails = details.toLowerCase();
        const noInteractionPhrases = [
          "no significant interaction",
          "no interaction found",
          "no interaction",
          "safe",
          "khÃƒÂ´ng cÃƒÂ³ tÃ†Â°Ã†Â¡ng tÃƒÂ¡c nÃƒÂ o Ã„â€˜Ã†Â°Ã¡Â»Â£c biÃ¡ÂºÂ¿t Ã„â€˜Ã¡ÂºÂ¿n",
          "khÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y tÃ†Â°Ã†Â¡ng tÃƒÂ¡c",
          "khÃƒÂ´ng cÃƒÂ³ tÃ†Â°Ã†Â¡ng tÃƒÂ¡c",
          "khÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y",
          "an toÃƒÂ n",
          "khÃƒÂ´ng cÃƒÂ³",
        ];

        const hasInteraction = details.length > 0 && !noInteractionPhrases.some((phrase) => lowerDetails.includes(phrase));

        interactions.push({
          drug1,
          drug2,
          details,
          hasInteraction,
        });
      }
    });
  }

  return interactions;
}

// Extract summary section
function extractSummary(text: string): string {
  const summaryMatch = text.match(/### (?:Final Summary|TÃƒÂ³m TÃ¡ÂºÂ¯t CuÃ¡Â»â€˜i CÃƒÂ¹ng)\n([\s\S]*?)$/);
  return summaryMatch ? summaryMatch[1].trim() : "";
}

function parseAnswerSummary(text: string): string {
  const finalSummary = text.match(/###\s*Final Summary\s*\n([\s\S]*?)(?=\n###|$)/i);
  if (finalSummary?.[1]?.trim()) {
    return finalSummary[1].trim();
  }

  const overallRisk = text.match(/\*\*Overall Risk:\*\*[\s\S]*?(?=\n###|\n####|$)/i);
  if (overallRisk?.[0]?.trim()) {
    return overallRisk[0].trim();
  }

  return extractSummary(text);
}

function parseAnswerInteractions(text: string): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];
  const sectionMatch = text.match(/###\s*Interactions Between Drug Pairs\s*\n([\s\S]*?)(?=\n###\s*Final Summary|$)/i);
  const section = sectionMatch?.[1] || "";

  if (section) {
    const headingRegex = /####\s*(.+?)\s*\+\s*(.+?)\s*\n/g;
    const headings = Array.from(section.matchAll(headingRegex));

    headings.forEach((heading, index) => {
      const start = (heading.index || 0) + heading[0].length;
      const end = headings[index + 1]?.index ?? section.length;
      const body = section.slice(start, end).trim();
      const details =
        body.match(/\*\*Interaction Details:\*\*\s*([\s\S]*?)(?=\n\*\*|\n####|$)/i)?.[1]?.trim() ||
        body.replace(/\*\*Status:\*\*.*$/gim, "").trim();
      const status = body.match(/\*\*Status:\*\*\s*(.+)/i)?.[1]?.trim() || "";
      const lowerText = `${status}\n${details}`.toLowerCase();
      const hasExplicitWarning = ["has interaction", "potential interaction", "interaction warning", "moderate", "major", "severe"].some((phrase) =>
        lowerText.includes(phrase)
      );
      const isSafe =
        !hasExplicitWarning &&
        ["safe", "no interaction", "no significant interaction", "no clinically significant interaction", "not found"].some((phrase) =>
          lowerText.includes(phrase)
        );

      interactions.push({
        drug1: heading[1].trim(),
        drug2: heading[2].trim(),
        details,
        hasInteraction: !isSafe && details.length > 0,
      });
    });
  }

  if (interactions.length > 0) {
    return interactions;
  }

  const bulletRegex = /-\s*\*\*(.+?)\s+(?:and|\+)\s+(.+?):\*\*\s*([\s\S]*?)(?=\n-\s*\*\*|\n###|$)/gi;
  Array.from(text.matchAll(bulletRegex)).forEach((match) => {
    const details = match[3].trim();
    const lowerDetails = details.toLowerCase();
    const hasExplicitWarning = ["has interaction", "potential interaction", "interaction warning", "moderate", "major", "severe"].some((phrase) =>
      lowerDetails.includes(phrase)
    );
    const isSafe =
      !hasExplicitWarning &&
      ["safe", "no interaction", "no significant interaction", "no clinically significant interaction", "not found"].some((phrase) =>
        lowerDetails.includes(phrase)
      );
    interactions.push({
      drug1: match[1].trim(),
      drug2: match[2].trim(),
      details,
      hasInteraction: !isSafe && details.length > 0,
    });
  });

  return interactions;
}

function parsedSummaryHasUsefulData(summaryData: ParsedResult["summary"] | undefined): boolean {
  if (!summaryData) {
    return false;
  }

  const risk = summaryData.overall_risk?.trim().toLowerCase();
  return Boolean(
    (risk && !["none", "low", "khong co", "khÃ´ng cÃ³"].includes(risk)) ||
      (summaryData.major_interactions?.length || 0) > 0 ||
      (summaryData.recommendations?.length || 0) > 0
  );
}

function normalizeDrugName(name: string): string {
  return name
    .replace(/^[\s\-*]+/, "")
    .replace(/[,+/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenizeDrugName(name: string): string[] {
  return normalizeDrugName(name)
    .split(" ")
    .filter((token) => token.length > 2);
}

function isDrugNameMatch(candidate: string, target: string): boolean {
  const normalizedCandidate = normalizeDrugName(candidate);
  const normalizedTarget = normalizeDrugName(target);

  if (!normalizedCandidate || !normalizedTarget) {
    return false;
  }

  if (normalizedCandidate === normalizedTarget) {
    return true;
  }

  const targetTokens = tokenizeDrugName(target);
  if (targetTokens.length === 0) {
    return false;
  }

  return targetTokens.every((token) => normalizedCandidate.includes(token));
}

function isMultiDrugSearchUrl(link: string, targetName: string): boolean {
  try {
    const url = new URL(link);
    if (!url.pathname.toLowerCase().startsWith("/search.php")) {
      return false;
    }

    const searchTerm = url.searchParams.get("searchterm") || "";
    const normalizedSearchTerm = normalizeDrugName(searchTerm);
    const targetTokens = tokenizeDrugName(targetName);
    const matchingTargetTokens = targetTokens.filter((token) => normalizedSearchTerm.includes(token)).length;
    const searchTokens = tokenizeDrugName(searchTerm);

    return searchTokens.length > targetTokens.length + 2 || matchingTargetTokens < Math.max(1, Math.min(2, targetTokens.length));
  } catch {
    return false;
  }
}

function findDrugReference(name: string, drugLinks?: Record<string, string>): DrugReference | undefined {
  if (!drugLinks) {
    return undefined;
  }

  const match = Object.entries(drugLinks).find(([key]) => {
    return isDrugNameMatch(key, name);
  });

  return match ? { name, link: match[1] } : undefined;
}

function getSafeDrugReferenceUrl(reference: DrugReference | undefined, fallbackName: string): string {
  const searchUrl = `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(fallbackName)}`;

  if (!reference?.link) {
    return searchUrl;
  }

  try {
    const url = new URL(reference.link);
    const isDrugsCom = url.hostname === "drugs.com" || url.hostname.endsWith(".drugs.com");

    if (!isDrugsCom) {
      return reference.link;
    }

    const path = url.pathname.toLowerCase();
    const isKnownDrugsComSection = [
      "/cdi/",
      "/dosage/",
      "/ingredient/",
      "/international/",
      "/mtm/",
      "/natural/",
      "/pregnancy/",
      "/price-guide/",
      "/pro/",
      "/search.php",
    ].some((prefix) => path.startsWith(prefix));

    if (isKnownDrugsComSection && !isMultiDrugSearchUrl(reference.link, fallbackName)) {
      return reference.link;
    }

    return searchUrl;
  } catch {
    return searchUrl;
  }
}

function attachReferencesToInteractions(interactions: DrugInteraction[], drugLinks?: Record<string, string>): DrugInteraction[] {
  return interactions.map((interaction) => ({
    ...interaction,
    reference1: interaction.reference1 ?? findDrugReference(interaction.drug1, drugLinks),
    reference2: interaction.reference2 ?? findDrugReference(interaction.drug2, drugLinks),
  }));
}

function attachReferencesToConversions(conversions: DrugConversion[], drugLinks?: Record<string, string>): DrugConversion[] {
  return conversions.map((conversion) => ({
    ...conversion,
    reference: conversion.reference ?? findDrugReference(conversion.converted, drugLinks) ?? findDrugReference(conversion.original, drugLinks),
  }));
}

export function InteractionResults({ result, isLoading }: InteractionResultsProps) {
  // Parse data first (even if we might return early)
  let drugConversions: DrugConversion[] = [];
  let drugInteractions: DrugInteraction[] = [];
  let summary: string = "";
  let parsedSummary: ParsedResult["summary"] | undefined = undefined;
  let answerText: string = "";
  const drugLinks = typeof result === "string" ? undefined : result?.drug_links;

  if (result) {
    if (typeof result === "string") {
      // Old format: parse markdown string
      answerText = result;
      drugConversions = parseDrugConversions(result);
      drugInteractions = parseAnswerInteractions(result);
      if (drugInteractions.length === 0) {
        drugInteractions = parseDrugInteractions(result);
      }
      summary = parseAnswerSummary(result);
    } else {
      // New format: use parsed_result if available, fallback to parsing answer
      answerText = result.answer || "";
      const answerDrugConversions = parseDrugConversions(answerText);
      const answerDrugInteractions = parseAnswerInteractions(answerText);
      const legacyAnswerDrugInteractions = parseDrugInteractions(answerText);
      const answerSummary = parseAnswerSummary(answerText);

      if (result.parsed_result) {
        // Use parsed data
        drugConversions = result.parsed_result.drug_conversion || [];
        if (result.parsed_result.interactions) {
          drugInteractions = result.parsed_result.interactions.map((interaction) => ({
            drug1: interaction.drug1,
            drug2: interaction.drug2,
            details: interaction.details,
            hasInteraction:
              ["Has Interaction", "Có Tương Tác"].includes(interaction.status) &&
              !["no significant interaction", "no clinically significant interaction", "safe"].some((phrase) =>
                interaction.details.toLowerCase().includes(phrase)
              ),
            reference1: interaction.reference1,
            reference2: interaction.reference2,
          }));
        }
        parsedSummary = result.parsed_result.summary;

        if (drugConversions.length === 0) {
          drugConversions = answerDrugConversions;
        }

        if (drugInteractions.length === 0) {
          drugInteractions = answerDrugInteractions.length > 0 ? answerDrugInteractions : legacyAnswerDrugInteractions;
        }

        // Generate summary text from structured data
        const usefulParsedSummary = parsedSummaryHasUsefulData(parsedSummary) ? parsedSummary : undefined;
        if (usefulParsedSummary) {
          summary = `**Overall Risk:** ${usefulParsedSummary.overall_risk || "Unspecified"}\n\n`;
          if (usefulParsedSummary.major_interactions && usefulParsedSummary.major_interactions.length > 0) {
            summary += "**Key Interactions:**\n";
            usefulParsedSummary.major_interactions.forEach((interaction) => {
              summary += `- ${interaction}\n`;
            });
            summary += "\n";
          }
          if (usefulParsedSummary.recommendations && usefulParsedSummary.recommendations.length > 0) {
            summary += "**Clinical Recommendations:**\n";
            usefulParsedSummary.recommendations.forEach((rec) => {
              summary += `- ${rec}\n`;
            });
          }
        } else {
          parsedSummary = undefined;
          summary = answerSummary;
        }
      } else if (answerText) {
        // Fallback to parsing markdown
        drugConversions = answerDrugConversions;
        drugInteractions = answerDrugInteractions;
        summary = answerSummary;
      }
    }
  }

  drugConversions = attachReferencesToConversions(drugConversions, drugLinks);
  drugInteractions = attachReferencesToInteractions(drugInteractions, drugLinks);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Analyzing Interactions...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Checking drug interactions in the database...</p>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return null;
  }

  // Determine severity based on parsed interactions
  // Priority: parsed interactions > parsed summary > text keywords (only if no parsed data)
  const hasAnyInteraction = drugInteractions.some((interaction) => interaction.hasInteraction);

  // Check risk level in parsed summary first (most reliable)
  let hasRisk = false;
  if (parsedSummary?.overall_risk) {
    const riskLevel = parsedSummary.overall_risk.toLowerCase();
    hasRisk = !["none", "low", "khong co", "thap", "khong xac dinh"].some((safe) => riskLevel.includes(safe));
  } else if (summary) {
    const lowerSummary = summary.toLowerCase();
    hasRisk = !lowerSummary.includes("overall risk: none") && !lowerSummary.includes("overall risk: low");
  }

  // Only check warning keywords if we DON'T have parsed data (fallback for old format)
  // This prevents false positives from keywords when we have reliable parsed data
  let hasWarningKeywords = false;
  const hasParsedData = typeof result !== "string" && result.parsed_result;
  if (!hasParsedData && drugInteractions.length > 0) {
    const lowerAnswerText = answerText.toLowerCase();
    hasWarningKeywords =
      lowerAnswerText.includes("nghiÃƒÂªm trÃ¡Â»Âng") ||
      lowerAnswerText.includes("nguy hiÃ¡Â»Æ’m") ||
      lowerAnswerText.includes("chÃ¡Â»â€˜ng chÃ¡Â»â€° Ã„â€˜Ã¡Â»â€¹nh") ||
      lowerAnswerText.includes("chÃ¡ÂºÂ£y mÃƒÂ¡u") ||
      lowerAnswerText.includes("Ã„â€˜Ã¡Â»â„¢c tÃƒÂ­nh");
  }

  // Severity: prioritize actual parsed interactions
  // If no interactions in table, always show safe (regardless of risk level in summary)
  // Risk level in summary should only be used as additional context when there ARE interactions
  // This ensures consistency: if table shows "An ToÃƒÂ n" for all pairs, header should also be safe
  const severity: "info" | "warning" | "safe" = hasAnyInteraction || (hasRisk && hasAnyInteraction) || hasWarningKeywords ? "warning" : "safe";

  const getIcon = () => {
    switch (severity) {
      case "safe":
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getTitle = () => {
    switch (severity) {
      case "safe":
        return "No Interactions Found";
      case "warning":
        return "Interaction Warning";
      default:
        return "Interaction Information";
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <Alert
        variant={severity === "warning" ? "destructive" : "default"}
        className={
          severity === "safe"
            ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
            : severity === "warning"
              ? undefined
              : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
        }
      >
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1">
            <AlertTitle className="text-base font-semibold mb-2">{getTitle()}</AlertTitle>
          </div>
        </div>
      </Alert>

      {/* Summary Section */}
      {summary && (
        <Card className="border-2 border-primary shadow-xl ring-2 ring-primary/20 bg-gradient-to-br from-primary/10 via-background to-primary/10">
          <CardHeader className="bg-gradient-to-r from-primary/15 to-transparent border-b-2 border-primary/30">
            <CardTitle className="text-lg font-semibold">Final Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="markdown-content text-base leading-relaxed font-medium">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-foreground">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0 text-foreground">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-2 first:mt-0 text-foreground">{children}</h3>,
                  p: ({ children }) => <p className="mb-3 last:mb-0 text-foreground">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-2">{children}</ol>,
                  li: ({ children }) => <li className="text-base">{children}</li>,
                  strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 italic my-3">{children}</blockquote>,
                }}
              >
                {summary}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drug Name Conversions Table */}
      {drugConversions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Drug Name Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Original Name</TableHead>
                  <TableHead className="w-1/2">Converted Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drugConversions.map((conv, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {conv.original}
                      {getSafeDrugReferenceUrl(conv.reference, conv.converted || conv.original) && (
                        <a
                          href={getSafeDrugReferenceUrl(conv.reference, conv.converted || conv.original)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center gap-1 text-primary hover:underline text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </TableCell>
                    <TableCell>{conv.converted}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Drug Interactions Table */}
      {drugInteractions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Interactions Between Drug Pairs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20%]">Drug 1</TableHead>
                    <TableHead className="w-[20%]">Drug 2</TableHead>
                    <TableHead className="w-[15%]">Status</TableHead>
                    <TableHead className="w-[45%]">Interaction Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drugInteractions.map((interaction, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium whitespace-normal">
                        {interaction.drug1}
                        {getSafeDrugReferenceUrl(interaction.reference1, interaction.drug1) && (
                          <a
                            href={getSafeDrugReferenceUrl(interaction.reference1, interaction.drug1)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 inline-flex items-center gap-1 text-primary hover:underline text-xs"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="font-medium whitespace-normal">
                        {interaction.drug2}
                        {getSafeDrugReferenceUrl(interaction.reference2, interaction.drug2) && (
                          <a
                            href={getSafeDrugReferenceUrl(interaction.reference2, interaction.drug2)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 inline-flex items-center gap-1 text-primary hover:underline text-xs"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        {interaction.hasInteraction ? (
                          <span className="inline-flex items-center gap-1 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-xs font-medium">Has Interaction</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Safe</span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm whitespace-normal">{interaction.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fallback: If parsing fails, show original markdown */}
      {drugConversions.length === 0 && drugInteractions.length === 0 && !summary && (
        <Card>
          <CardContent className="pt-6">
            <div className="markdown-content text-sm leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-border pl-4 italic my-2">{children}</blockquote>,
                }}
              >
                {answerText}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
