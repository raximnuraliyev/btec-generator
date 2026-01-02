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
} from 'docx';
import { GeneratedContent, ContentSection, TableData } from '../types';
import * as fs from 'fs';
import * as path from 'path';

const EXPORT_DIR = path.join(process.cwd(), 'exports');

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

export const generateDocx = async (
  assignmentId: string,
  content: GeneratedContent,
  unitName: string,
  unitCode: string
): Promise<string> => {
  const sections: any[] = [];

  // Title
  sections.push(
    new Paragraph({
      text: `${unitName} (${unitCode})`,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Introduction
  sections.push(
    new Paragraph({
      text: 'Introduction',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 200 },
    })
  );

  sections.push(
    ...content.introduction.split('\n').map(
      (line) =>
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: 'Times New Roman',
              size: 28, // 14pt in half-points
            }),
          ],
          spacing: { line: 360 }, // 1.5 line spacing
        })
    )
  );

  // Content sections
  for (const section of content.sections) {
    sections.push(
      new Paragraph({
        text: section.heading,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      })
    );

    sections.push(
      ...section.content.split('\n').map(
        (line) =>
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                font: 'Times New Roman',
                size: 28,
              }),
            ],
            spacing: { line: 360 },
          })
      )
    );

    // Add tables if present
    if (section.tables && section.tables.length > 0) {
      for (const tableData of section.tables) {
        sections.push(createTable(tableData));
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: tableData.caption,
                font: 'Times New Roman',
                size: 28,
                bold: true,
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        );
      }
    }

    // Add image placeholders if present
    if (section.images && section.images.length > 0) {
      for (const image of section.images) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `[Image Placeholder: ${image.description}]`,
                font: 'Times New Roman',
                size: 28,
                italics: true,
              }),
            ],
            spacing: { before: 200, after: 200 },
          })
        );
      }
    }
  }

  // Conclusion
  sections.push(
    new Paragraph({
      text: 'Conclusion',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 200 },
    })
  );

  sections.push(
    ...content.conclusion.split('\n').map(
      (line) =>
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: 'Times New Roman',
              size: 28,
            }),
          ],
          spacing: { line: 360 },
        })
    )
  );

  // References
  sections.push(
    new Paragraph({
      text: 'References',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 200 },
    })
  );

  for (const reference of content.references) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: reference.text,
            font: 'Times New Roman',
            size: 28,
          }),
        ],
        spacing: { line: 360, after: 100 },
      })
    );
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

  fs.writeFileSync(filepath, buffer);

  // Return relative URL path
  return `/exports/${filename}`;
};

const createTable = (tableData: TableData): Table => {
  const rows: TableRow[] = [];

  // Header row
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
                    bold: true,
                    font: 'Times New Roman',
                    size: 28,
                  }),
                ],
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
                      font: 'Times New Roman',
                      size: 28,
                    }),
                  ],
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
  });
};
