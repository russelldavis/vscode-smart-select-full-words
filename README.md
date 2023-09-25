# Smart Select Full Words

Adds custom full word selection (via regex config) to [smart select](https://www.youtube.com/watch?v=dO4SGAMl7uQ).

Without this extension, smart select won't select hyphenated words (e.g. foo-bar). This extension
allows you to configure regular expressions that add additional ranges to smart select. By default,
it adds hyphenated words, dotted-and-hyphenated words, tailwind custom variant syntax
(foo-[bar(baz)]), and catchall words (for things like URLs in comments or strings).

Take note of the [`editor.smartSelect.selectSubwords` setting](https://code.visualstudio.com/updates/v1_80#_skip-subword-when-shrinking-and-expanding-selection). When using this extension with the
default config and the `smartSelectFullWords.expand` command, subwords will be selected regardless
of this setting. However, when this this setting is enabled, after running
`smartSelectFullWords.expand`, you can then run the Shrink Selection command to shrink the selection
to the subword your cursor was on.

## Settings
`smartSelectFullWords.regexes`: To disable a default value, set it to empty. If the name is prefixed by `!: `, the match will be selected immediately (bypassing selection of smaller words) when using the `smartSelectFullWords.expand` command (you can then shrink the selection to smaller words by running the builtin Shrink Selection command).

**Enjoy!**
