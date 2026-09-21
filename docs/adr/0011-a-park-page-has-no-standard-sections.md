# ADR-0011: A Park page's write-up has no standard sections

- **Status**: Accepted, amends ADR-0007
- **Date**: 2026-09-20

## Context

ADR-0007 puts every topic about a Park on its own Park page, as an `h2` heading, not a page of its own. It left one line open: whether a Park page has a standard set of topics, and what each one tracks (#111).

23 of 258 Park pages have `##` headings today, using 42 different headings between them. Only 4 pages share a set of three: Play Area, Eating Area, Athletic Fields. #112's large-screen design holds open an idea that needs this decision first: show the figures a section reports beside its text, each with its own icon and tracked value.

CONTEXT.md now names two kinds of Park page body (#171). A Sourced description is third person, 8th-grade level, and brief: every fact traces to a source, and the standard does not allow adding subsections to fill space. A Visit report is the owner's own first-person write-up; no agent rewrites one, so no section template applies to it either.

ADR-0001 already gives an authored fact about the whole Park a home beside `geo` in `ParkMeta`. It shows in the rail, not beside a section of the write-up. Facilities is a heading rendered from the `facilities` front matter, not free prose (ADR-0007); this decision is about the write-up itself, not that heading.

## Decision

**A Park page's write-up has no standard set of sections, and tracks no figure per section.** A heading in the write-up is free prose, added when the writer has something to say under it. It is not a slot in a template, and it carries no measurement of its own. A fact worth tracking about the whole Park already has a home in `ParkMeta`, and shows in the rail.

## Consequences

- Closes ADR-0007's open line. The write-up has no standard set of topics, and tracks no figure per topic.
- #112's "measurements beside the text" idea is dropped, not merely unblocked. A section of the write-up has no figure of its own to show beside it.
- The 23 Park pages that already have `##` headings keep them, as free prose. This decision does not rename or remove one.
