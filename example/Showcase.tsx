import { useEffect, type ReactNode } from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Column,
  Grid,
  GridItem,
  Row,
  SmartGrid,
  Spacer,
  type FlexJustify,
  type LastRowMode,
  type RenderItem,
} from 'rn-smart-grid';

// Full-screen layouts used for the README screenshots. Tap to go to the next
// screen, long-press to leave. Open one directly with
// `adb shell am start -a android.intent.action.VIEW -d rnsmartgrid://showcase/<n>`.

export const colors = {
  violet: '#7C5CFF',
  coral: '#FF6B6B',
  amber: '#FFB938',
  mint: '#22C59E',
  sky: '#3A9BFF',
  pink: '#FF5FA2',
  teal: '#14B8C4',
  ink: '#11132A',
  ink2: '#1C1F3D',
  ink3: '#2A2E55',
  text: '#F4F5FF',
  muted: '#9AA0D0',
};

const cycle = [
  colors.violet,
  colors.sky,
  colors.mint,
  colors.amber,
  colors.coral,
  colors.pink,
  colors.teal,
];
const tint = (i: number) => cycle[i % cycle.length]!;
const mono = Platform.select({ ios: 'Menlo', default: 'monospace' });

// ---------------------------------------------------------------------------
// Building blocks

function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

function Block({ color, label, fill = true }: { color: string; label: string; fill?: boolean }) {
  return (
    <Column fill={fill} align="center" justify="center" style={{ backgroundColor: color }}>
      <Label>{label}</Label>
    </Column>
  );
}

function Frame({ title, code, children }: { title: string; code: string; children: ReactNode }) {
  return (
    <Column fill gap={18} paddingX={20} paddingY={28} style={styles.frame}>
      <Column gap={6}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.code}>{code}</Text>
      </Column>
      {children}
    </Column>
  );
}

function Tile({ color, text, height }: { color: string; text?: string; height?: number }) {
  return (
    <View style={[styles.tile, { backgroundColor: color }, height ? { height } : styles.fill]}>
      {text ? <Text style={styles.tileText}>{text}</Text> : null}
    </View>
  );
}

const numbers = (n: number) => Array.from({ length: n }, (_, i) => i);
const renderNumber: RenderItem<number> = ({ item }) => (
  <Tile color={tint(item)} text={String(item + 1)} />
);

// ---------------------------------------------------------------------------
// Screens: Row / Column basics (full bleed)

function TwoColumns() {
  return (
    <Row fill>
      <Block color={colors.violet} label="<Column fill />" />
      <Block color={colors.coral} label="<Column fill />" />
    </Row>
  );
}

function TwoRows() {
  return (
    <Column fill>
      <Block color={colors.sky} label="<Row fill />" />
      <Block color={colors.amber} label="<Row fill />" />
    </Column>
  );
}

function ThreeColumns() {
  return (
    <Row fill>
      <Block color={colors.violet} label="flex 1" />
      <Block color={colors.pink} label="flex 1" />
      <Block color={colors.mint} label="flex 1" />
    </Row>
  );
}

function SplitColumns() {
  return (
    <Row fill>
      <Block color={colors.violet} label="<Column fill />" />
      <Column fill>
        <Block color={colors.coral} label="<Row fill />" />
        <Block color={colors.amber} label="<Row fill />" />
      </Column>
    </Row>
  );
}

function HolyGrail() {
  return (
    <Column fill>
      <Row align="center" justify="center" style={[styles.bar, { backgroundColor: colors.ink3 }]}>
        <Label>header</Label>
      </Row>
      <Row fill>
        <Column align="center" justify="center" style={[styles.side, { backgroundColor: colors.sky }]}>
          <Label>nav</Label>
        </Column>
        <Block color={colors.violet} label="<Column fill />" />
        <Column align="center" justify="center" style={[styles.side, { backgroundColor: colors.pink }]}>
          <Label>aside</Label>
        </Column>
      </Row>
      <Row align="center" justify="center" style={[styles.bar, { backgroundColor: colors.mint }]}>
        <Label>footer</Label>
      </Row>
    </Column>
  );
}

// ---------------------------------------------------------------------------
// Screens: grids

function ProductGrid() {
  return (
    <Frame title="SmartGrid" code="data={18 items} cols={4} gap={10}">
      <SmartGrid data={numbers(18)} cols={4} gap={10} itemAspectRatio={0.66} renderItem={renderNumber} />
      <Text style={styles.note}>18 ÷ 4 → rows of 4, 4, 4, 4, 2. The last two keep their width.</Text>
    </Frame>
  );
}

const MODES: LastRowMode[] = ['align', 'center', 'end', 'stretch'];

function LastRowModes() {
  return (
    <Frame title="lastRow" code={"'align' | 'center' | 'end' | 'stretch'"}>
      <Column gap={22}>
        {MODES.map((mode, m) => (
          <Column key={mode} gap={8}>
            <Text style={styles.caption}>lastRow="{mode}"</Text>
            <SmartGrid
              data={numbers(5)}
              cols={3}
              gap={8}
              lastRow={mode}
              itemAspectRatio={2.1}
              renderItem={({ item }) => <Tile color={item >= 3 ? tint(m + 2) : colors.ink3} />}
            />
          </Column>
        ))}
      </Column>
    </Frame>
  );
}

function Bento() {
  return (
    <Frame title="Spans" code="<GridItem span={2} />">
      <Grid cols={4} gap={10}>
        <GridItem span={4} style={[styles.tile, styles.big, { backgroundColor: colors.violet }]}>
          <Text style={styles.tileText}>span 4</Text>
        </GridItem>
        <GridItem span={2} style={[styles.tile, styles.mid, { backgroundColor: colors.sky }]}>
          <Text style={styles.tileText}>span 2</Text>
        </GridItem>
        <GridItem span={2} style={[styles.tile, styles.mid, { backgroundColor: colors.mint }]}>
          <Text style={styles.tileText}>span 2</Text>
        </GridItem>
        <GridItem style={[styles.tile, styles.mid, { backgroundColor: colors.amber }]}>
          <Text style={styles.tileText}>1</Text>
        </GridItem>
        <GridItem span={3} style={[styles.tile, styles.mid, { backgroundColor: colors.coral }]}>
          <Text style={styles.tileText}>span 3</Text>
        </GridItem>
        <GridItem span={3} style={[styles.tile, styles.mid, { backgroundColor: colors.pink }]}>
          <Text style={styles.tileText}>span 3</Text>
        </GridItem>
        <GridItem style={[styles.tile, styles.mid, { backgroundColor: colors.teal }]}>
          <Text style={styles.tileText}>1</Text>
        </GridItem>
        {numbers(4).map((i) => (
          <GridItem key={i} style={[styles.tile, styles.small, { backgroundColor: colors.ink3 }]}>
            <Text style={styles.tileText}>1</Text>
          </GridItem>
        ))}
      </Grid>
    </Frame>
  );
}

function Offsets() {
  const steps = [0, 1, 2, 3, 2, 1, 0];
  return (
    <Frame title="Offsets" code="<GridItem offset={2} />">
      <Grid cols={4} gap={10}>
        {steps.map((offset, i) => (
          <GridItem
            key={i}
            offset={offset}
            style={[styles.tile, styles.mid, { backgroundColor: tint(i) }]}
          >
            <Text style={styles.tileCaption}>offset</Text>
            <Text style={styles.tileNumber}>{offset}</Text>
          </GridItem>
        ))}
        <GridItem offset={1} span={2} style={[styles.tile, styles.mid, { backgroundColor: colors.ink3 }]}>
          <Text style={styles.tileText}>offset 1 · span 2</Text>
        </GridItem>
      </Grid>
    </Frame>
  );
}

interface Photo {
  id: number;
  featured: boolean;
}
const PHOTOS: Photo[] = numbers(26).map((id) => ({ id, featured: id === 0 || id === 9 || id === 17 }));
const photoSpan = (p: Photo) => (p.featured ? 2 : 1);
const renderPhoto: RenderItem<Photo> = ({ item }) => (
  <View
    style={[
      styles.photo,
      { backgroundColor: tint(item.id), opacity: item.featured ? 1 : 0.88 },
    ]}
  >
    {item.featured ? <Text style={styles.photoTag}>span 2</Text> : null}
  </View>
);

function Gallery() {
  return (
    <Frame title="Gallery" code="itemAspectRatio={1} getSpan={…}">
      <SmartGrid
        data={PHOTOS}
        cols={3}
        gap={4}
        itemAspectRatio={1}
        getSpan={photoSpan}
        lastRow="center"
        renderItem={renderPhoto}
      />
    </Frame>
  );
}

function Responsive() {
  const sizes = [
    { name: 'base', cols: 2 },
    { name: 'sm', cols: 3 },
    { name: 'md', cols: 4 },
  ];
  return (
    <Frame title="Responsive cols" code="cols={{ base: 2, sm: 3, md: 4 }}">
      <Column gap={22}>
        {sizes.map((s, k) => (
          <Column key={s.name} gap={8}>
            <Text style={styles.caption}>
              {s.name} → {s.cols} columns
            </Text>
            <SmartGrid
              data={numbers(6)}
              cols={s.cols}
              gap={8}
              itemAspectRatio={1.7}
              renderItem={({ item }) => <Tile color={item === 0 ? tint(k) : colors.ink3} />}
            />
          </Column>
        ))}
      </Column>
    </Frame>
  );
}

const JUSTIFY: FlexJustify[] = ['start', 'center', 'end', 'between', 'around', 'evenly'];

function RowJustify() {
  return (
    <Frame title="Row & Spacer" code={'<Row justify="between" gap={8} />'}>
      <Column gap={14}>
        {JUSTIFY.map((justify, i) => (
          <Column key={justify} gap={6}>
            <Text style={styles.caption}>justify="{justify}"</Text>
            <Row justify={justify} gap={8} padding={8} style={styles.track}>
              {numbers(3).map((k) => (
                <View key={k} style={[styles.chip, { backgroundColor: tint(i) }]} />
              ))}
            </Row>
          </Column>
        ))}
        <Column gap={6}>
          <Text style={styles.caption}>{'<Spacer /> pushes the rest to the end'}</Text>
          <Row align="center" gap={10} padding={10} style={styles.track}>
            <View style={[styles.avatar, { backgroundColor: colors.pink }]} />
            <Column gap={4}>
              <View style={[styles.line, styles.lineLong]} />
              <View style={styles.line} />
            </Column>
            <Spacer />
            <View style={[styles.button, { backgroundColor: colors.violet }]}>
              <Text style={styles.buttonText}>Follow</Text>
            </View>
          </Row>
        </Column>
      </Column>
    </Frame>
  );
}

// ---------------------------------------------------------------------------

export const SCREENS = [
  { key: 'two-columns', Component: TwoColumns },
  { key: 'two-rows', Component: TwoRows },
  { key: 'three-columns', Component: ThreeColumns },
  { key: 'split', Component: SplitColumns },
  { key: 'holy-grail', Component: HolyGrail },
  { key: 'smartgrid', Component: ProductGrid },
  { key: 'last-row', Component: LastRowModes },
  { key: 'spans', Component: Bento },
  { key: 'offsets', Component: Offsets },
  { key: 'gallery', Component: Gallery },
  { key: 'responsive', Component: Responsive },
  { key: 'row-justify', Component: RowJustify },
] as const;

export function Showcase({
  index,
  linkCount,
  onIndexChange,
  onExit,
}: {
  index: number;
  linkCount?: number;
  onIndexChange: (index: number) => void;
  onExit: () => void;
}) {
  const insets = useSafeAreaInsets();
  const screen = SCREENS[index % SCREENS.length]!;

  useEffect(() => {
    // Logged so screenshots can be cropped to the app area.
    console.log(`[showcase] ${JSON.stringify({ index, key: screen.key, insets })}`);
  }, [index, screen.key, insets, linkCount]);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar hidden />
      <Pressable
        style={styles.fill}
        onPress={() => onIndexChange((index + 1) % SCREENS.length)}
        onLongPress={onExit}
      >
        <screen.Component />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  fill: { flex: 1 },
  frame: { backgroundColor: colors.ink },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  code: { color: colors.muted, fontSize: 13, fontFamily: mono },
  caption: { color: colors.muted, fontSize: 12, fontFamily: mono },
  note: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  label: {
    color: '#fff',
    fontSize: 14,
    fontFamily: mono,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  bar: { height: 96 },
  side: { width: 92 },
  tile: { borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileText: { color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: mono },
  tileCaption: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: mono },
  tileNumber: { color: '#fff', fontSize: 26, fontWeight: '800' },
  big: { height: 150 },
  mid: { height: 96 },
  small: { height: 64 },
  photo: { flex: 1, borderRadius: 6, padding: 8, justifyContent: 'flex-end' },
  photoTag: { color: '#fff', fontSize: 11, fontWeight: '700', fontFamily: mono },
  track: { backgroundColor: colors.ink2, borderRadius: 12 },
  chip: { width: 34, height: 34, borderRadius: 9 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  line: { width: 70, height: 8, borderRadius: 4, backgroundColor: colors.ink3 },
  lineLong: { width: 110 },
  button: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 18 },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
