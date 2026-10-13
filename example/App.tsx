import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  Column,
  Grid,
  GridItem,
  LayoutProvider,
  Row,
  SmartGrid,
  Spacer,
  useBreakpoint,
  type RenderItem,
} from 'rn-smart-grid';
import { Showcase } from './Showcase';

// ---------------------------------------------------------------------------
// Data

interface Product {
  id: string;
  name: string;
  price: number;
}

const productKey = (item: Product) => item.id;

const PRODUCTS: Product[] = Array.from({ length: 18 }, (_, i) => ({
  id: `p${i + 1}`,
  name: `Product ${i + 1}`,
  price: 9 + ((i * 7) % 40),
}));

interface Photo {
  id: string;
  hue: number;
  featured: boolean;
}

const PHOTOS: Photo[] = Array.from({ length: 23 }, (_, i) => ({
  id: `photo-${i}`,
  hue: (i * 37) % 360,
  featured: i % 7 === 0,
}));

interface Row1k {
  id: string;
  label: string;
}

const makeRows = (from: number, count: number): Row1k[] =>
  Array.from({ length: count }, (_, i) => ({ id: `v${from + i}`, label: `#${from + i + 1}` }));

// ---------------------------------------------------------------------------
// Demo 1: product grid, 18 items in 4 columns → 4, 4, 4, 4, 2

function ProductGrid() {
  const [lastRow, setLastRow] = useState<'align' | 'stretch' | 'center' | 'end'>('align');
  const renderProduct = useCallback<RenderItem<Product>>(
    ({ item }) => (
      <View style={styles.card}>
        <View style={styles.thumb} />
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardMeta}>${item.price}</Text>
      </View>
    ),
    [],
  );

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.h1}>Product grid</Text>
      <Text style={styles.p}>18 items, 4 columns. Change how the 2-item last row is laid out:</Text>
      <Row gap={8} wrap>
        {(['align', 'stretch', 'center', 'end'] as const).map((mode) => (
          <Chip key={mode} label={mode} active={mode === lastRow} onPress={() => setLastRow(mode)} />
        ))}
      </Row>
      <Spacer size={16} />
      <SmartGrid
        data={PRODUCTS}
        cols={4}
        gap={12}
        lastRow={lastRow}
        keyExtractor={productKey}
        renderItem={renderProduct}
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Demo 2: responsive gallery with itemAspectRatio and featured spans

const galleryCols = { base: 2, sm: 3, md: 4, lg: 6 };
const photoSpan = (photo: Photo) => (photo.featured ? 2 : 1);

function Gallery() {
  const breakpoint = useBreakpoint();
  const renderPhoto = useCallback<RenderItem<Photo>>(
    ({ item }) => (
      <View style={[styles.photo, { backgroundColor: `hsl(${item.hue}, 60%, 65%)` }]}>
        {item.featured ? <Text style={styles.badge}>featured</Text> : null}
      </View>
    ),
    [],
  );

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.h1}>Responsive gallery</Text>
      <Text style={styles.p}>
        cols = {'{ base: 2, sm: 3, md: 4, lg: 6 }'}. Current breakpoint: {breakpoint}. Rotate the
        device or resize the window.
      </Text>
      <SmartGrid
        data={PHOTOS}
        cols={galleryCols}
        gap={6}
        itemAspectRatio={1}
        getSpan={photoSpan}
        lastRow="center"
        renderItem={renderPhoto}
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Demo 3: hand-written layout with Grid / GridItem, Row / Column / Spacer

function Dashboard() {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.h1}>Mixed spans</Text>
      <Grid cols={3} gap={10}>
        <GridItem span={2} style={[styles.tile, styles.tileA]}>
          <Text style={styles.tileText}>span 2</Text>
        </GridItem>
        <GridItem style={styles.tile}>
          <Text style={styles.tileText}>1</Text>
        </GridItem>
        <GridItem style={styles.tile}>
          <Text style={styles.tileText}>1</Text>
        </GridItem>
        <GridItem offset={1} style={[styles.tile, styles.tileB]}>
          <Text style={styles.tileText}>offset 1</Text>
        </GridItem>
        <GridItem span={3} style={[styles.tile, styles.tileC]}>
          <Text style={styles.tileText}>span 3 (full width)</Text>
        </GridItem>
        <GridItem style={styles.tile}>
          <Text style={styles.tileText}>last row, aligned</Text>
        </GridItem>
      </Grid>

      <Spacer size={24} />
      <Text style={styles.h2}>Row / Column / Spacer</Text>
      <Column gap={8} padding={12} style={styles.panel}>
        <Row align="center">
          <Text style={styles.cardTitle}>Title on the start</Text>
          <Spacer />
          <Text style={styles.cardMeta}>end</Text>
        </Row>
        <Row gap={8} justify="between">
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </Row>
      </Column>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Demo 4: virtualized grid with 1,000 items

function Virtualized() {
  const [data, setData] = useState(() => makeRows(0, 1000));
  const [refreshing, setRefreshing] = useState(false);

  const renderCell = useCallback<RenderItem<Row1k>>(
    ({ item, row, col }) => (
      <View style={styles.vcell}>
        <Text style={styles.cardTitle}>{item.label}</Text>
        <Text style={styles.cardMeta}>
          r{row} c{col}
        </Text>
      </View>
    ),
    [],
  );

  const onEndReached = useCallback(() => {
    setData((prev) => (prev.length >= 2000 ? prev : [...prev, ...makeRows(prev.length, 100)]));
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setData(makeRows(0, 1000));
      setRefreshing(false);
    }, 600);
  }, []);

  const header = useMemo(
    () => (
      <View style={styles.listHeader}>
        <Text style={styles.h1}>Virtualized</Text>
        <Text style={styles.p}>
          {data.length} items, 4 columns, fixed rowHeight so FlatList can skip measuring. Scroll to
          the end to load more.
        </Text>
      </View>
    ),
    [data.length],
  );

  return (
    <SmartGrid
      virtualized
      data={data}
      cols={4}
      gap={8}
      rowHeight={72}
      renderItem={renderCell}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={header}
      ListEmptyComponent={<Text style={styles.p}>No items</Text>}
      contentContainerStyle={styles.screen}
    />
  );
}

// ---------------------------------------------------------------------------
// Shell

const DEMOS = [
  { key: 'products', label: 'Products', Component: ProductGrid },
  { key: 'gallery', label: 'Gallery', Component: Gallery },
  { key: 'grid', label: 'Grid', Component: Dashboard },
  { key: 'virtual', label: '1,000', Component: Virtualized },
] as const;

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

/** `rnsmartgrid://showcase/3` → 3 */
const showcaseIndexFromUrl = (url: string | null | undefined) => {
  const match = url?.match(/showcase\/(\d+)/);
  return match ? Number(match[1]) : null;
};

export default function App() {
  const [demo, setDemo] = useState<(typeof DEMOS)[number]['key']>('products');
  const [showcase, setShowcase] = useState<number | null>(null);
  // Bumped on every deep link so re-opening the same screen still re-logs it.
  const [linkCount, setLinkCount] = useState(0);
  const Active = DEMOS.find((d) => d.key === demo)!.Component;

  useEffect(() => {
    const open = (url: string | null | undefined) => {
      const index = showcaseIndexFromUrl(url);
      if (index !== null) {
        setShowcase(index);
        setLinkCount((n) => n + 1);
      }
    };
    Linking.getInitialURL().then(open);
    const subscription = Linking.addEventListener('url', (event) => open(event.url));
    return () => subscription.remove();
  }, []);

  if (showcase !== null) {
    return (
      <SafeAreaProvider>
        <Showcase
          index={showcase}
          linkCount={linkCount}
          onIndexChange={setShowcase}
          onExit={() => setShowcase(null)}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <LayoutProvider breakpoints={{ sm: 360, md: 600, lg: 900, xl: 1200 }}>
        <SafeAreaView style={styles.root}>
          <Row gap={8} paddingX={16} paddingY={10} wrap style={styles.tabs}>
            {DEMOS.map((d) => (
              <Chip
                key={d.key}
                label={d.label}
                active={d.key === demo}
                onPress={() => setDemo(d.key)}
              />
            ))}
            <Chip label="Showcase ▸" active={false} onPress={() => setShowcase(0)} />
          </Row>
          <View style={styles.root}>
            <Active />
          </View>
        </SafeAreaView>
      </LayoutProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f7f9' },
  screen: { padding: 16 },
  tabs: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#d0d4da' },
  h1: { fontSize: 22, fontWeight: '700', marginBottom: 6, color: '#111' },
  h2: { fontSize: 17, fontWeight: '600', marginBottom: 8, color: '#111' },
  p: { fontSize: 14, color: '#555', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 8 },
  thumb: { aspectRatio: 1, borderRadius: 6, backgroundColor: '#e4e7ec', marginBottom: 6 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#111' },
  cardMeta: { fontSize: 12, color: '#666' },
  photo: { flex: 1, borderRadius: 4, justifyContent: 'flex-end', padding: 6 },
  badge: { alignSelf: 'flex-start', fontSize: 11, color: '#fff', fontWeight: '700' },
  tile: {
    minHeight: 72,
    borderRadius: 8,
    backgroundColor: '#dfe6f1',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  tileA: { backgroundColor: '#c7d7fe' },
  tileB: { backgroundColor: '#fde3c7' },
  tileC: { backgroundColor: '#cdeedd' },
  tileText: { fontSize: 13, color: '#222', textAlign: 'center' },
  panel: { backgroundColor: '#fff', borderRadius: 10 },
  dot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#9aa5b5' },
  vcell: {
    height: 72,
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 8,
    justifyContent: 'center',
  },
  listHeader: { marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e7eaef',
  },
  chipActive: { backgroundColor: '#1f3b73' },
  chipText: { fontSize: 13, color: '#333' },
  chipTextActive: { color: '#fff' },
});
