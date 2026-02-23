

# Separate Photo Upload from Analysis

## Problem
Currently, when a user selects a photo on the Add Item page, the app immediately uploads it and calls the analyze-clothing function. The user wants control over when analysis happens.

## Solution
Split `handleFileSelect` into two steps:
1. **Photo selection** -- only sets the preview image and stores the file
2. **Analyze Now button** -- uploads the photo and triggers AI analysis on demand

## Changes

### `src/pages/AddItem.tsx`

**1. Simplify `handleFileSelect`**
Remove all upload/analyze logic. It should only do:
- Store the file in state (`setPhotoFile`)
- Create and set a preview URL (`setPhotoPreview`)

**2. Create new `handleAnalyze` function**
Move the upload + analyze logic into a separate async function triggered by a button click.

**3. Add "Analyze Now" button**
Show a button below the photo preview (only visible when a photo is selected and not yet analyzing):

```text
[Photo Preview]
[ Analyze Now button ]
```

- Uses the existing `Sparkles` or `Camera` icon with "Analyze Now" label
- Disabled while `analyzing` is true
- Hidden if no photo is selected

