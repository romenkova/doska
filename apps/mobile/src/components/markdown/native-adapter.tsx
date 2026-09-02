import type {
  ImageSource,
  MarkdownAdapter,
  MarkdownRenderers,
} from "@doska/markdown"
import { Checkbox, Separator } from "@doska/ui-kit-mobile"
import { Fragment } from "react"
import { Linking, ScrollView, Text, View } from "react-native"

// Body copy: 1rem at the web's 16px root, line-height 1.6.
const BODY = "font-sans text-base leading-6 text-card-foreground"

function blockImage(
  source: ImageSource,
  alt: string,
  renderImage: MarkdownRenderers["renderImage"],
  key: string
) {
  const custom =
    source.kind === "attachment" ? renderImage?.(source.key, alt) : undefined
  if (custom)
    return (
      <View key={key} className="my-1">
        {custom}
      </View>
    )

  return (
    <View
      key={key}
      className="my-1 rounded-md border border-border bg-muted px-3 py-4"
    >
      <Text className="font-sans text-[13px] text-muted-foreground">
        {alt || "Image"}
      </Text>
    </View>
  )
}

/**
 * The React Native half of the renderer. Everything shared with the web —
 * task numbering, which nodes are wikilinks, URL safety — is settled by
 * `renderMarkdown` before it reaches these methods.
 */
export function createNativeAdapter(
  renderers: MarkdownRenderers
): MarkdownAdapter {
  return {
    // ----------------------------------------------------------- blocks
    paragraph(runs, style, key) {
      return (
        <View key={key} className="gap-1">
          {runs.map((run, i) =>
            run.kind === "inline" ? (
              <Text
                key={i}
                className={style.muted ? `${BODY} text-muted-foreground` : BODY}
              >
                {run.children}
              </Text>
            ) : (
              <Fragment key={i}>{run.node}</Fragment>
            )
          )}
        </View>
      )
    },

    // Every heading level is body-sized on the web; only the weight and, at h3,
    // the colour set them apart.
    heading(depth, children, _id, key) {
      return (
        <Text
          key={key}
          className={
            depth >= 3
              ? "mt-1 font-sans-bold text-base leading-5 text-muted-foreground"
              : "mt-1 font-sans-bold text-base leading-5 text-card-foreground"
          }
        >
          {children}
        </Text>
      )
    },

    list(_ordered, _start, items, key) {
      return (
        <View key={key} className="gap-1.5">
          {items}
        </View>
      )
    },

    listItem(marker, blocks, key) {
      return (
        <View key={key} className="flex-row gap-1.5">
          {marker.kind === "task" ? (
            <Checkbox
              className="mt-1"
              checked={marker.checked}
              onPress={marker.onToggle}
            />
          ) : (
            <Text className={`min-w-[18px] ${BODY} text-muted-foreground`}>
              {marker.kind === "number" ? `${marker.value}.` : "•"}
            </Text>
          )}
          <View className="flex-1 gap-1">{blocks}</View>
        </View>
      )
    },

    blockquote(blocks, key) {
      return (
        <View key={key} className="gap-2 border-l-2 border-quote-bar pl-3">
          {blocks}
        </View>
      )
    },

    code(value, _lang, key) {
      return (
        <ScrollView
          key={key}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="rounded-md border border-border bg-muted"
          contentContainerClassName="p-3"
        >
          <Text className="font-mono text-[13px] leading-5 text-card-foreground">
            {value}
          </Text>
        </ScrollView>
      )
    },

    thematicBreak(key) {
      return <Separator key={key} className="my-1" />
    },

    table(head, body, key) {
      return (
        <ScrollView key={key} horizontal showsHorizontalScrollIndicator={false}>
          <View className="overflow-hidden rounded-md border border-border">
            {head}
            {body}
          </View>
        </ScrollView>
      )
    },

    tableRow(cells, header, key) {
      return (
        <View
          key={key}
          className={header ? "flex-row" : "flex-row border-t border-border"}
        >
          {cells}
        </View>
      )
    },

    tableCell(children, cell, key) {
      return (
        <View
          key={key}
          className={[
            "w-36 px-3 py-2",
            cell.column === 0 ? "" : "border-l border-border",
            cell.header ? "bg-muted" : "",
          ].join(" ")}
        >
          <Text
            className={
              cell.header
                ? "font-sans-semibold text-sm text-card-foreground"
                : "font-sans text-sm text-card-foreground"
            }
            style={{ textAlign: cell.align ?? "left" }}
          >
            {children}
          </Text>
        </View>
      )
    },

    // Raw HTML has no native equivalent; showing the source beats dropping it.
    html(value, key) {
      return (
        <Text key={key} className="font-mono text-[13px] text-muted-foreground">
          {value}
        </Text>
      )
    },

    footnoteDefinition(label, blocks, key) {
      return (
        <View key={key} className="flex-row gap-2">
          <Text className="font-sans text-[13px] text-muted-foreground">
            {label}
          </Text>
          <View className="flex-1">{blocks}</View>
        </View>
      )
    },

    // ----------------------------------------------------------- inline
    text(value) {
      return value
    },

    lineBreak() {
      return "\n"
    },

    strong(children, key) {
      return (
        <Text key={key} className="font-sans-bold">
          {children}
        </Text>
      )
    },

    emphasis(children, key) {
      return (
        <Text key={key} className="italic">
          {children}
        </Text>
      )
    },

    strikethrough(children, key) {
      return (
        <Text key={key} className="line-through">
          {children}
        </Text>
      )
    },

    mark(children, key) {
      return (
        <Text key={key} className="bg-mark">
          {children}
        </Text>
      )
    },

    inlineCode(value, key) {
      return (
        <Text key={key} className="bg-muted font-mono text-[13px]">
          {` ${value} `}
        </Text>
      )
    },

    link(url, children, key) {
      return (
        <Text
          key={key}
          className="text-primary underline"
          onPress={() => {
            if (url) void Linking.openURL(url)
          }}
        >
          {children}
        </Text>
      )
    },

    // A view cannot be nested in a text node, so an image sharing a line with
    // text is reduced to its alt.
    image(source, alt, position, key) {
      if (position === "inline")
        return alt ? <Text key={key}>{alt}</Text> : null
      return blockImage(source, alt, renderers.renderImage, key)
    },

    wikilink(target, alias, key) {
      const custom = renderers.renderWikilink?.(target, alias)
      if (custom) return <Fragment key={key}>{custom}</Fragment>
      return (
        <Text
          key={key}
          className="bg-muted font-sans-medium text-[13px] text-muted-foreground"
        >
          {` ${alias ?? target} `}
        </Text>
      )
    },

    cut(key) {
      return (
        <Text key={key} className="font-sans text-xs text-muted-foreground">
          {"— end of preview —"}
        </Text>
      )
    },

    footnoteReference(label, key) {
      return (
        <Text key={key} className="font-sans text-[11px] text-muted-foreground">
          {label}
        </Text>
      )
    },
  }
}
