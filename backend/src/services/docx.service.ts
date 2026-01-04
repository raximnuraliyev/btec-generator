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
  BorderStyle,
} from 'docx';
import { GeneratedContent, TableData, AtomicContentBlock } from '../types';
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
 * 
 * HEADING STRUCTURE:
 * - Heading 1: Introduction, Learning Aims, Conclusion, References (centered)
 * - Heading 2: Criteria codes (e.g., A.P1, A.M1, B.D1) (left-aligned)
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
    referencesCount: content?.references?.length || 0,
    hasAtomicBlocks: !!(content?.atomicBlocks && content.atomicBlocks.length > 0)
  });
  
  if (!content) {
    throw new Error('Invalid content structure: content is null');
  }

  // Use atomic blocks if available, otherwise fall back to legacy structure
  if (content.atomicBlocks && content.atomicBlocks.length > 0) {
    console.log('[DOCX] Using ATOMIC block structure');
    return generateDocxFromAtomicBlocks(assignmentId, content.atomicBlocks, unitName, unitCode);
  }
  
  console.log('[DOCX] Using LEGACY section structure');
  return generateDocxFromLegacyStructure(assignmentId, content, unitName, unitCode);
};

/**
 * NEW ATOMIC DOCX GENERATION
 * Each atomic block = ONE heading + ONE content block
 * This ensures proper structure: Introduction → Learning Aims → Criteria → Conclusion → References
 */
async function generateDocxFromAtomicBlocks(
  assignmentId: string,
  atomicBlocks: AtomicContentBlock[],
  unitName: string,
  unitCode: string
): Promise<string> {
  const sections: any[] = [];
  let sectionNumber = 0;
  let tableCounter = 1;
  let figureCounter = 1;
  let currentAimNumber = 0;

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

  // Process each atomic block
  for (const block of atomicBlocks) {
    switch (block.type) {
      case 'INTRODUCTION': {
        sectionNumber++;
        // Introduction heading (Heading 1, centered)
        sections.push(
          new Paragraph({
            text: `${sectionNumber}. Introduction`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          })
        );

        // Introduction content
        if (block.content) {
          const paragraphs = block.content.split('\n\n').filter(p => p.trim());
          for (const paragraph of paragraphs) {
            sections.push(createContentParagraph(paragraph));
          }
        }
        break;
      }

      case 'LEARNING_AIM': {
        sectionNumber++;
        currentAimNumber++;
        const aimCode = block.aimCode || String.fromCharCode(64 + currentAimNumber);
        
        // Learning Aim heading (Heading 1, centered)
        // Format: "2. Learning Aim A: [Title]" or "AIM A: [Title]"
        const aimTitle = block.aimTitle || `Learning Aim ${aimCode}`;
        sections.push(
          new Paragraph({
            text: `${sectionNumber}. ${aimTitle}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          })
        );

        // Learning aim introduction content (80-120 words)
        if (block.aimContent) {
          const paragraphs = block.aimContent.split('\n\n').filter(p => p.trim());
          for (const paragraph of paragraphs) {
            sections.push(createContentParagraph(paragraph));
          }
        }
        break;
      }

      case 'CRITERION': {
        const criterionCode = block.criterionCode || 'A.P1';
        const criterionTitle = block.criterionTitle || criterionCode;
        
        // Criterion heading (Heading 2, left-aligned)
        // Format: "2.1 A.P1 Describe the key components..."
        sections.push(
          new Paragraph({
            text: criterionTitle,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.LEFT,
            spacing: { before: 300, after: 200 },
          })
        );

        // Criterion content
        if (block.criterionContent) {
          const paragraphs = block.criterionContent.split('\n\n').filter(p => p.trim());
          for (const paragraph of paragraphs) {
            sections.push(createContentParagraph(paragraph));
          }
        }

        // Table for this criterion (if present)
        if (block.table) {
          sections.push(createFormattedTable(block.table));
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: block.table.caption || `Table ${tableCounter}. Data table`,
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

        // Image placeholder for this criterion (if present)
        if (block.image) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `[IMAGE PLACEHOLDER]`,
                  font: FONT_NAME,
                  size: FONT_SIZE,
                  bold: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 100 },
              border: {
                top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              },
            })
          );
          
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: block.image.caption || `Figure ${figureCounter}. ${block.image.description || 'Diagram'}`,
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
          figureCounter++;
        }
        break;
      }

      case 'CONCLUSION': {
        sectionNumber++;
        // Conclusion heading (Heading 1, centered)
        sections.push(
          new Paragraph({
            text: `${sectionNumber}. Conclusion`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          })
        );

        // Conclusion content
        if (block.content) {
          const paragraphs = block.content.split('\n\n').filter(p => p.trim());
          for (const paragraph of paragraphs) {
            sections.push(createContentParagraph(paragraph));
          }
        }
        break;
      }

      case 'REFERENCES': {
        sectionNumber++;
        // References heading (Heading 1, centered)
        sections.push(
          new Paragraph({
            text: `${sectionNumber}. References`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          })
        );

        // References as numbered list
        if (block.references && block.references.length > 0) {
          // Sort by id/order
          const sortedRefs = [...block.references].sort((a, b) => 
            (a.id || a.order || 0) - (b.id || b.order || 0)
          );
          
          for (const ref of sortedRefs) {
            const refNumber = ref.id || ref.order || 1;
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${refNumber}. ${ref.text}`,
                    font: FONT_NAME,
                    size: FONT_SIZE,
                  }),
                ],
                alignment: AlignmentType.LEFT,
                indent: { left: 360, hanging: 360 }, // Hanging indent for references
                spacing: { line: LINE_SPACING, after: 120 },
              })
            );
          }
        }
        break;
      }
    }
  }

  // Create document
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

  console.log('[DOCX] Writing atomic file to:', filepath);
  fs.writeFileSync(filepath, buffer);
  console.log('[DOCX] Atomic file written successfully, size:', buffer.length, 'bytes');

  return filepath;
}

/**
 * Create a content paragraph with proper formatting
 */
function createContentParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text.trim(),
        font: FONT_NAME,
        size: FONT_SIZE,
      }),
    ],
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: FIRST_LINE_INDENT },
    spacing: { line: LINE_SPACING },
  });
}

/**
 * LEGACY DOCX GENERATION (backward compatibility)
 */
async function generateDocxFromLegacyStructure(
  assignmentId: string,
  content: GeneratedContent,
  unitName: string,
  unitCode: string
): Promise<string> {
  if (!content.sections || content.sections.length === 0) {
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
  let learningAimLetter = 'A';
  for (const section of content.sections) {
    // Skip sections without heading or content
    if (!section.heading || !section.content) continue;

    // Learning Aim Heading (Heading 1, Centered, Bold)
    // Format as "AIM A: [Title]" or "AIM B: [Title]"
    const aimHeading = section.heading.toUpperCase().startsWith('LEARNING AIM') 
      ? `AIM ${learningAimLetter}: ${section.heading.replace(/^Learning Aim [A-Z]\s*[-–:]?\s*/i, '')}`
      : `AIM ${learningAimLetter}: ${section.heading}`;
    
    sections.push(
      new Paragraph({
        text: aimHeading,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
      })
    );

    // Check if we have structured criteria data
    if (section.criteria && section.criteria.length > 0) {
      console.log(`[DOCX] Section ${learningAimLetter} has ${section.criteria.length} criteria`);
      
      // Use structured criteria - first add the intro paragraph (aim context)
      const introText = section.content.split('\n\n')[0]?.trim();
      if (introText) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: introText,
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

      // Now add each criterion with its code heading
      for (const criterion of section.criteria) {
        // Format criterion code with learning aim letter prefix (e.g., A.P1, A.M1, A.D1)
        let formattedCode = criterion.code;
        
        // If code is just P1, M1, D1 etc., add the learning aim letter
        if (/^[PMD]\d+$/i.test(formattedCode)) {
          formattedCode = `${learningAimLetter}.${formattedCode.toUpperCase()}`;
        } else if (formattedCode.includes('.')) {
          // Already has a dot - keep as is but ensure uppercase
          formattedCode = formattedCode.toUpperCase();
        } else {
          // Fallback - add learning aim letter
          formattedCode = `${learningAimLetter}.${formattedCode.toUpperCase()}`;
        }

        console.log(`[DOCX] Adding criterion: ${formattedCode}`);

        // Add criterion heading (Heading 2)
        sections.push(
          new Paragraph({
            text: formattedCode,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.LEFT,
            spacing: { before: 300, after: 200 },
          })
        );

        // Add criterion content paragraphs
        const criterionParagraphs = criterion.content.split('\n\n').filter(p => p.trim());
        for (const paragraph of criterionParagraphs) {
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
        }
      }
    } else {
      console.log(`[DOCX] Section ${learningAimLetter} has NO structured criteria - using fallback`);
      
      // Fallback: parse content and try to identify criteria by paragraph structure
      const contentParagraphs = section.content.split('\n\n').filter(p => p.trim());
      
      // Track criterion index for this learning aim
      let criterionIndex = 0;
      
      // First paragraph is intro to the learning aim (aim context)
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

      // Process remaining paragraphs as criterion content
      for (let i = 1; i < contentParagraphs.length; i++) {
        const paragraph = contentParagraphs[i].trim();
        
        // Add criterion heading if it's a substantial block (more than 150 chars indicates new criterion)
        if (paragraph.length > 150) {
          criterionIndex++;
          // Determine criterion type based on position
          let criterionType = 'P'; // Default to Pass
          if (criterionIndex > 3) criterionType = 'M';
          if (criterionIndex > 5) criterionType = 'D';
          
          const criterionCode = `${learningAimLetter}.${criterionType}${criterionIndex <= 3 ? criterionIndex : (criterionIndex <= 5 ? criterionIndex - 3 : criterionIndex - 5)}`;
          
          // Add criterion heading
          sections.push(
            new Paragraph({
              text: criterionCode,
              heading: HeadingLevel.HEADING_2,
              alignment: AlignmentType.LEFT,
              spacing: { before: 300, after: 200 },
            })
          );
        }
        
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
    }
    
    // Increment learning aim letter for next section
    learningAimLetter = String.fromCharCode(learningAimLetter.charCodeAt(0) + 1);

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
        // Add a placeholder box for the image
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `[IMAGE PLACEHOLDER]`,
                font: FONT_NAME,
                size: FONT_SIZE,
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
            border: {
              top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            },
          })
        );
        
        // Figure caption below placeholder
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
            spacing: { after: 200 },
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

    // Sort references by order number, then alphabetically
    const sortedReferences = [...content.references].sort((a, b) => {
      if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
      const textA = a.text || '';
      const textB = b.text || '';
      return textA.localeCompare(textB);
    });

    // Add numbered references (simple format: 1. Reference text)
    sortedReferences.forEach((reference, index) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${reference.text}`,
              font: FONT_NAME,
              size: FONT_SIZE,
            }),
          ],
          alignment: AlignmentType.LEFT,
          indent: { left: 360, hanging: 360 }, // Hanging indent for references
          spacing: { line: LINE_SPACING, after: 120 },
        })
      );
    });
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
