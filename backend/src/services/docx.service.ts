import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  HeadingLevel,
  AlignmentType,
  WidthType,
  TableOfContents,
  convertInchesToTwip,
  BorderStyle,
} from 'docx';
import { GeneratedContent, ContentSection, TableData } from '../types';
import * as fs from 'fs';
import * as path from 'path';

const EXPORT_DIR = path.join(process.cwd(), 'exports');

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

/**
 * GLOBAL DOCUMENT RULES:
 * - Font: Times New Roman
 * - Font size: 14pt (28 half-points)
 * - Alignment: Justified
 * - First line indent: 0.5 inch (720 twips)
 * - Line spacing: 1.5 (360)
 * - Language: User-selected
 */

const FONT_SIZE = 28; // 14pt in half-points
const FONT_NAME = 'Times New Roman';
const FIRST_LINE_INDENT = 720; // 0.5 inch in twips
const LINE_SPACING = 360; // 1.5 line spacing

export const generateDocx = async (
  assignmentId: string,
  content: GeneratedContent,
  unitName: string,
  unitCode: string
): Promise<string> => {
  console.log('[DOCX] Starting generation for assignment:', assignmentId);
  console.log('[DOCX] Content structure:', {
    hasIntroduction: !!content?.introduction,
    sectionsCount: content?.sections?.length || 0,
    hasConclusion: !!content?.conclusion,
    referencesCount: content?.references?.length || 0
  });
  
  if (!content || !content.sections || content.sections.length === 0) {
    throw new Error('Invalid content structure: missing sections');
  }
  
  const sections: any[] = [];
  let tableCounter = 1;
  let figureCounter = 1;

  // COVER PAGE - Title (Centered, Bold, Heading 1)
  sections.push(
    new Paragraph({
      text: `${unitName} (${unitCode})`,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      style: 'Heading1'
    })
  );

  // TABLE OF CONTENTS
  sections.push(
    new Paragraph({
      text: 'Table of Contents',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
    })
  );
  
  sections.push(
    new TableOfContents('Table of Contents', {
      hyperlink: true,
      headingStyleRange: '1-2',
    })
  );

  // INTRODUCTION
  if (content.introduction) {
    sections.push(
      new Paragraph({
        text: 'Introduction',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
      })
    );

    const introParagraphs = content.introduction.split('\n\n').filter(p => p.trim());
    introParagraphs.forEach((paragraph) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: paragraph.trim(),
              font: FONT_NAME,
              size: FONT_SIZE,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: FIRST_LINE_INDENT },
          spacing: { line: LINE_SPACING },
        })
      );
    });
  }

  // LEARNING AIM SECTIONS WITH CRITERIA
  for (const section of content.sections) {
    // Skip sections without heading or content
    if (!section.heading || !section.content) continue;

    // Learning Aim Heading (Heading 1, Centered, Bold)
    sections.push(
      new Paragraph({
        text: section.heading,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
      })
    );

    // Intro paragraph for Learning Aim (if available)
    const contentParagraphs = section.content.split('\n\n').filter(p => p.trim());
    
    // First paragraph is intro to the learning aim
    if (contentParagraphs.length > 0) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: contentParagraphs[0].trim(),
              font: FONT_NAME,
              size: FONT_SIZE,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: FIRST_LINE_INDENT },
          spacing: { line: LINE_SPACING },
        })
      );
    }

    // CRITERION SECTIONS (P/M/D)
    // Extract criterion code from heading if present (e.g., "P1 - ", "M2: ", "D1 –")
    const criterionMatch = section.heading.match(/([PMD]\d+)/i);
    if (criterionMatch) {
      const criterionCode = criterionMatch[1];
      
      // Criterion Heading (Heading 2, Left-aligned, Bold)
      sections.push(
        new Paragraph({
          text: section.heading,
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.LEFT,
          spacing: { before: 300, after: 200 },
        })
      );

      // Criterion body content (skip first paragraph as it was used as intro)
      for (let i = 1; i < contentParagraphs.length; i++) {
        const paragraph = contentParagraphs[i].trim();
        
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph,
                font: FONT_NAME,
                size: FONT_SIZE,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: FIRST_LINE_INDENT },
            spacing: { line: LINE_SPACING },
          })
        );
      }
    } else {
      // Regular content paragraphs (not a criterion)
      for (let i = 1; i < contentParagraphs.length; i++) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: contentParagraphs[i].trim(),
                font: FONT_NAME,
                size: FONT_SIZE,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: FIRST_LINE_INDENT },
            spacing: { line: LINE_SPACING },
          })
        );
      }
    }

    // Add tables if present (after explanatory paragraphs)
    if (section.tables && section.tables.length > 0) {
      for (const tableData of section.tables) {
        sections.push(createFormattedTable(tableData));
        
        // Table caption (below table, centered, bold + italic)
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Table ${tableCounter}. ${tableData.caption || 'Data table'}`,
                font: FONT_NAME,
                size: FONT_SIZE,
                bold: true,
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        );
        tableCounter++;
      }
    }

    // Add image placeholders if present
    if (section.images && section.images.length > 0) {
      for (const image of section.images) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Figure ${figureCounter}. ${image.description || 'Diagram'}`,
                font: FONT_NAME,
                size: FONT_SIZE,
                bold: true,
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          })
        );
        figureCounter++;
      }
    }
  }

  // CONCLUSION
  if (content.conclusion) {
    sections.push(
      new Paragraph({
        text: 'Conclusion',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
      })
    );

    const conclusionParagraphs = content.conclusion.split('\n\n').filter(p => p.trim());
    conclusionParagraphs.forEach((paragraph) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: paragraph.trim(),
              font: FONT_NAME,
              size: FONT_SIZE,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: FIRST_LINE_INDENT },
          spacing: { line: LINE_SPACING },
        })
      );
    });
  }

  // REFERENCES
  if (content.references && content.references.length > 0) {
    sections.push(
      new Paragraph({
        text: 'References',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
      })
    );

    // Sort references alphabetically
    const sortedReferences = [...content.references].sort((a, b) => {
      const textA = a.text || '';
      const textB = b.text || '';
      return textA.localeCompare(textB);
    });

    for (const reference of sortedReferences) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: reference.text,
              font: FONT_NAME,
              size: FONT_SIZE,
            }),
          ],
          alignment: AlignmentType.LEFT,
          indent: { hanging: 360 }, // Hanging indent for references
          spacing: { line: LINE_SPACING, after: 100 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `assignment_${assignmentId}_${Date.now()}.docx`;
  const filepath = path.join(EXPORT_DIR, filename);

  console.log('[DOCX] Writing file to:', filepath);
  fs.writeFileSync(filepath, buffer);
  console.log('[DOCX] File written successfully, size:', buffer.length, 'bytes');

  // Return absolute file path for streaming
  return filepath;
};

/**
 * Create a formatted table following DOCX specification:
 * - Centered table
 * - Bold header row
 * - Times New Roman, 14pt
 * - Bordered
 */
const createFormattedTable = (tableData: TableData): Table => {
  const rows: TableRow[] = [];

  // Header row (bold)
  rows.push(
    new TableRow({
      children: tableData.headers.map(
        (header) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: header,
                    font: FONT_NAME,
                    size: FONT_SIZE,
                    bold: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            width: {
              size: 100 / tableData.headers.length,
              type: WidthType.PERCENTAGE,
            },
          })
      ),
    })
  );

  // Data rows
  for (const row of tableData.rows) {
    rows.push(
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cell,
                      font: FONT_NAME,
                      size: FONT_SIZE,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: {
                size: 100 / row.length,
                type: WidthType.PERCENTAGE,
              },
            })
        ),
      })
    );
  }

  return new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    alignment: AlignmentType.CENTER,
  });
};
