# Task: Build a flex-based layout & grid library for React Native

You are a senior React Native engineer and library author. Build a small, production-quality
UI layout library in **TypeScript** for **React Native** (must also work with Expo and
react-native-web). The library provides layout primitives (`Row`, `Column`, `Grid`, `GridItem`,
`Spacer`) and a data-driven `SmartGrid` component.

## Core philosophy (non-negotiable)
- **Flexbox first.** Never compute widths as `100 / cols + '%'` or measure the screen to divide
  space. Each cell gets `flex: 1` (or `flex: span`) inside a row, and flexbox distributes space.
- **Gaps via the native `gap` / `rowGap` / `columnGap` style props** (RN >= 0.71). Provide a
  margin-based fallback behind an internal flag for older versions, but default to `gap`.
- Zero runtime dependencies besides `react` and `react-native` (peer deps).
- Fully typed with generics, tree-shakeable, no inline style objects recreated on every render
  (use `StyleSheet` + `useMemo`).

## 1. SmartGrid — the main component

```tsx
<SmartGrid
  data={items}            // T[]
  cols={4}
  gap={12}
  renderItem={({ item, index, row, col }) => <Card item={item} />}
  keyExtractor={(item, index) => item.id}
/>
```

### Behavior
- Split `data` into chunks of `cols`. Example: 18 items with `cols={4}` → 5 rows
  (4, 4, 4, 4, 2).
- Each row is a horizontal flex container; each cell is `flex: 1`, so all columns have equal width
  without any percentage math.
- **Last row handling** is critical. If the last row is incomplete, items must NOT stretch to fill
  the row by default. Pad the row with invisible placeholder cells (`flex: 1`, no content,
  `pointerEvents="none"`, hidden from accessibility) so the 2 remaining items keep the same width
  as items in the rows above. Make this configurable:
  - `lastRow="align"` (default): pad with placeholders, items aligned to the start
  - `lastRow="stretch"`: remaining items share the full width
  - `lastRow="center"`: equal-width items, centered (placeholders split on both sides)
  - `lastRow="end"`: equal-width items, aligned to the end
- Chunking must be memoized (`useMemo` on `data` and `cols`) and must be a pure, exported,
  unit-testable utility: `chunk<T>(data: T[], size: number): T[][]`.

### Props (TypeScript)
- `data: readonly T[]`
- `cols: number | ResponsiveValue<number>`: responsive form like
  `{ base: 2, sm: 3, md: 4, lg: 6 }`, resolved with `useWindowDimensions` and configurable
  breakpoints via a provider
- `gap?: number`, `rowGap?: number`, `columnGap?: number` (specific overrides `gap`)
- `renderItem: (info: { item: T; index: number; row: number; col: number }) => ReactNode`
- `keyExtractor?: (item: T, index: number) => string`
- `getSpan?: (item: T, index: number) => number`: lets an item span multiple columns
  (implemented with `flex: span`). The chunking algorithm must then pack by total span per row
  instead of item count, and clamp spans greater than `cols`.
- `itemAspectRatio?: number`: applies `aspectRatio` to each cell (useful for image galleries)
- `align?: 'start' | 'center' | 'end' | 'stretch'` (vertical alignment of cells within a row)
- `lastRow?: 'align' | 'stretch' | 'center' | 'end'`
- `virtualized?: boolean`: when true, render rows through a `FlatList` (each list item = one row)
  so large datasets stay performant. Pass through common FlatList props: `onEndReached`,
  `refreshControl`, `ListHeaderComponent`, `ListFooterComponent`, `ListEmptyComponent`,
  `contentContainerStyle`, `scrollEnabled`.
- When not virtualized, render a plain `View` (so it can sit inside an existing ScrollView).
- `style`, `rowStyle`, `cellStyle` (cellStyle may also be a function of `{ index, row, col }`)
- `testID`

### Edge cases to handle explicitly
- Empty array → render `ListEmptyComponent` or nothing
- `cols` <= 0, non-integer, or `NaN` → clamp to 1 with a dev-only warning
- `cols` greater than `data.length` → single row padded with placeholders (respecting `lastRow`)
- Data changes / `cols` changes at runtime (orientation change) → re-chunk correctly
- Stable keys for rows and cells to avoid remounting cells on re-chunk
- RTL layouts (`I18nManager.isRTL`) must work naturally

## 2. Layout primitives

### `Row` and `Column`
Thin wrappers over `View` with `flexDirection` preset and shorthand props:
- `gap`, `rowGap`, `columnGap`
- `align` (alignItems), `justify` (justifyContent) using friendly values:
  `'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' | 'stretch'`
- `wrap?: boolean` (Row only)
- `reverse?: boolean`
- `flex?: number`, `padding`, `paddingX`, `paddingY`, `fill?: boolean` (flex: 1)
- Forward refs and all other `ViewProps`

### `Grid` and `GridItem` (manual, declarative grid)
For when children are written by hand instead of passed as data:
```tsx
<Grid cols={3} gap={8}>
  <GridItem span={2}>...</GridItem>
  <GridItem>...</GridItem>
  <GridItem>...</GridItem>
</Grid>
```
- `Grid` reads its children, packs them into rows by span (same algorithm as SmartGrid), and
  applies the same last-row padding logic. Share the packing logic between both components.
- `GridItem` props: `span` (default 1), `offset` (renders empty placeholder cells before it),
  `style`.

### `Spacer`
`<Spacer />` = `flex: 1` filler; `<Spacer size={16} />` = fixed-size gap along the parent's axis.

## 3. Theming / configuration
- `<LayoutProvider breakpoints={{ sm: 360, md: 600, lg: 900, xl: 1200 }} spacing={4}>`
- Optional spacing scale: numeric gap values may be treated as multipliers of `spacing` when
  `useScale` is enabled; raw pixel values otherwise. Keep raw pixels as the default.
- Hook: `useBreakpoint()` returns the current breakpoint name.
- Helper: `resolveResponsive(value, breakpoint)`.

## 4. Performance requirements
- No re-chunking unless `data`, `cols` or `getSpan` changes
- Rows are `React.memo` components; cells receive stable props
- No layout measurement (`onLayout`) needed for the core grid
- Virtualized mode: correct `keyExtractor` for rows, sensible `windowSize` / `initialNumToRender`
  defaults, and `getItemLayout` support when a fixed `rowHeight` prop is provided

## 5. Deliverables
1. Folder structure (e.g. `src/components`, `src/utils`, `src/hooks`, `src/types`, `src/index.ts`)
2. Full source code for every file
3. Unit tests (Jest + @testing-library/react-native) covering: chunking, span packing, last-row
   modes, responsive cols, empty data, invalid cols
4. An example screen demonstrating: product grid (18 items, 4 cols), responsive gallery with
   `itemAspectRatio`, mixed spans with `Grid`/`GridItem`, and a virtualized grid with 1,000 items
5. A README with installation, API tables for every component, and usage examples
6. `package.json` configured for publishing (peerDependencies, `exports`, types, build with
   `react-native-builder-bob` or `tsup`)

## Output format
Start with a short explanation of the architecture and the packing algorithm (including how
last-row placeholders work), then output each file in its own code block preceded by its path.
Do not skip files or use placeholders like "// rest of implementation".