# Test Plan for DatabasePage Enhancements

## Sorting Functionality Tests

1. **Basic Sorting**
   - Click on each column header once to verify ascending sort (↑)
   - Click on the same header again to verify descending sort (↓)
   - Click a third time to verify return to unsorted state

2. **Type-Aware Sorting**
   - Verify numeric columns (valueCO2e, year, methodId) are sorted numerically
   - Verify string columns (name, unit, source, geo, kind) are sorted alphabetically with proper German locale

3. **Null/Undefined Handling**
   - Verify columns with undefined/null values place these values at the end of the sorting

4. **URL Parameter**
   - Verify that sorting state (column + direction) is reflected in URL parameters
   - Try reloading the page with sort parameters in URL to verify persistence
   - Navigate away and return to verify sorting is maintained

5. **ARIA Attributes**
   - Check that `aria-sort` attribute is correctly set on column headers
   - Verify visual indicators (up/down arrows) match the current sort direction

6. **Stable Sort**
   - Create test data with identical values in one column
   - Verify that sorting by that column maintains relative ordering of rows with identical values

## Edit Dataset Dialog Tests

1. **Open/Close Dialog**
   - Click edit button to verify dialog opens
   - Click close button (X) to verify dialog closes
   - Press ESC key to verify dialog closes
   - Click outside dialog to verify dialog closes

2. **Form Display**
   - Verify all fields are displayed: name, kind, unit, valueCO2e, source, year, geo, methodId
   - Verify form is correctly populated with dataset values

3. **Form Validation**
   - Submit form with empty required fields
   - Verify appropriate error messages display
   - Enter invalid formats (e.g., non-numeric valueCO2e) and verify validation errors

4. **Kind Field**
   - Test changing the kind dropdown
   - Verify the German labels display correctly in the UI
   - Verify the English values are sent to the API

5. **Submit Form**
   - Submit valid form data
   - Verify loading spinner displays during submission
   - Verify success toast appears after successful save
   - Verify dialog closes after successful save

6. **Error Handling**
   - Simulate network error or server error
   - Verify error toast appears
   - Verify dialog remains open with form data intact

7. **Row Update**
   - Edit a dataset and submit changes
   - Verify table row updates immediately with new data
   - Reload page and verify changes persist

## Edge Cases

1. **Very Large Values**
   - Test sorting with very large numbers
   - Test editing with very long text values

2. **Special Characters**
   - Test sorting and editing with special German characters (ä, ö, ü, ß)
   - Test with emoji or other Unicode characters

3. **Empty Table**
   - Test sorting functionality with empty table
   - Verify UI handles empty state gracefully

4. **Multiple Edits**
   - Edit multiple datasets in sequence
   - Verify all changes are saved correctly
   - Test concurrent editing scenarios

## Browser Compatibility

Test functionality in:
- Chrome
- Firefox
- Safari
- Edge

## Accessibility Testing

1. **Keyboard Navigation**
   - Tab through UI elements
   - Use keyboard to trigger sorting
   - Use keyboard to open, navigate and submit dialog

2. **Screen Reader Compatibility**
   - Test with screen reader to verify ARIA attributes work correctly
   - Verify form labels are read correctly
