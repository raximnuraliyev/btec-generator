# Frontend Multi-Language Implementation Guide

## Overview

The frontend has been updated to support native multi-language generation for assignments. Users can now select from 4 languages: **English**, **Russian (Русский)**, **Uzbek (O'zbekcha)**, and **Spanish (Español)**.

## Key Features

### 1. Assignment Generation Wizard (`AssignmentWizard.tsx`)

A comprehensive step-by-step wizard that guides users through:

1. **Select Level** (3, 4, 5, or 6)
2. **Select Brief** (loads briefs for the selected level)
3. **Select Grade Target** (PASS, MERIT, DISTINCTION)
4. **Select Language** ⭐ **NEW** - Native language selection
5. **Content Options** (include tables/images)
6. **Educational Disclaimer** (required acceptance)

#### Language Selection UI

```tsx
<RadioGroup value={selectedLanguage} onValueChange={setSelectedLanguage}>
  <div className="grid grid-cols-2 gap-4">
    {LANGUAGES.map((lang) => (
      <div key={lang.code} className="flex items-center space-x-2 border rounded p-3">
        <RadioGroupItem value={lang.code} id={`lang-${lang.code}`} />
        <Label htmlFor={`lang-${lang.code}`}>
          <div className="font-semibold">{lang.nativeName}</div>
          <div className="text-sm text-muted-foreground">{lang.name}</div>
        </Label>
      </div>
    ))}
  </div>
</RadioGroup>
```

**Important:** Language is a **required** field. Generation cannot proceed without selecting a language.

### 2. Student Profile Page (`StudentProfilePage.tsx`)

Complete academic profile management:

- **Personal Information**: Full name, date of birth
- **Academic Information**: University, student ID, course, year of study
- **Privacy**: All data encrypted and secure

Users must complete their profile before generating assignments.

### 3. Updated Navigation

The `DashboardPage` now includes:
- **Profile** button in the top navigation
- Links to profile management
- Clear visual hierarchy

## API Integration

### Generation Request

```typescript
const response = await api.post(
  '/assignments/generate',
  {
    briefId: selectedBrief,
    grade: selectedGrade,
    language: selectedLanguage, // ⭐ NEW
    includeImages,
    includeTables,
  },
  {
    headers: {
      'X-Disclaimer-Accepted': 'true',
    },
  }
);
```

### Supported Language Codes

- `en` - English
- `ru` - Russian (Русский)
- `uz` - Uzbek (O'zbekcha)
- `es` - Spanish (Español)

## User Flow

1. User logs in
2. User completes academic profile (required once)
3. User creates new assignment:
   - Select level
   - Select brief
   - Select grade target
   - **Select language** ⭐
   - Choose content options
   - Accept disclaimer
4. System generates assignment **natively in selected language**
5. User views/exports assignment

## Important Notes

### Native Generation vs. Translation

⚠️ **Critical:** The system generates content **natively** in the selected language. It does NOT translate English content to other languages. Each language has its own:

- Academic writing style
- Terminology
- Structure and flow
- Cultural context

### Language Immutability

Once an assignment is generated in a specific language, **the language cannot be changed**. This ensures:
- Consistent academic quality
- Proper terminology usage
- Coherent content structure

### Profile Requirements

Users **must** complete their academic profile before generating assignments. This ensures:
- Personalized content
- Academic integrity
- Proper student identification

## Components Reference

### `AssignmentWizard.tsx`
- **Location**: `src/app/components/AssignmentWizard.tsx`
- **Purpose**: Multi-step wizard for assignment generation
- **Key State**: `selectedLanguage` (en|ru|uz|es)

### `StudentProfilePage.tsx`
- **Location**: `src/app/components/StudentProfilePage.tsx`
- **Purpose**: Academic profile management
- **Validation**: Required fields enforced

### `DashboardPage.tsx`
- **Location**: `src/app/components/DashboardPage.tsx`
- **Updates**: Added Profile navigation button

### `App.tsx`
- **Location**: `src/app/App.tsx`
- **Updates**: Added 'profile' route to navigation

## Testing Checklist

- [ ] Can select all 4 languages
- [ ] Language selection is required (generation disabled without it)
- [ ] Profile page saves correctly
- [ ] Profile requirement enforced before generation
- [ ] API request includes language parameter
- [ ] Navigation works between all pages
- [ ] Disclaimer must be accepted
- [ ] Content options (tables/images) work correctly

## Future Enhancements

- Language preference saved in user settings
- Preview samples in each language
- Language-specific help text
- Multi-language UI localization (not just content)

---

**Made by Ajax Manson**
