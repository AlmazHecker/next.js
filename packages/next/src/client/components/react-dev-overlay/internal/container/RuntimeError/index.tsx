import * as React from 'react'
import { CodeFrame } from '../../components/CodeFrame'
import type { ReadyRuntimeError } from '../../helpers/getErrorByType'
import { noop as css } from '../../helpers/noop-template'
import { groupStackFramesByFramework } from '../../helpers/group-stack-frames-by-framework'
import { GroupedStackFrames } from './GroupedStackFrames'
import { ComponentStackFrameRow } from './ComponentStackFrameRow'

export type RuntimeErrorProps = { error: ReadyRuntimeError }

export function RuntimeError({ error }: RuntimeErrorProps) {
  const { firstFrame, allLeadingFrames, allCallStackFrames } =
    React.useMemo(() => {
      const filteredFrames = error.frames.filter(
        (f) =>
          !(
            f.sourceStackFrame.file === '<anonymous>' &&
            ['stringify', '<unknown>'].includes(f.sourceStackFrame.methodName)
          )
      )

      const firstFirstPartyFrameIndex = filteredFrames.findIndex(
        (e) => e.expanded && e.originalCodeFrame && e.originalStackFrame
      )

      return {
        firstFrame: filteredFrames[firstFirstPartyFrameIndex] ?? null,
        allLeadingFrames:
          firstFirstPartyFrameIndex < 0
            ? []
            : filteredFrames.slice(0, firstFirstPartyFrameIndex),
        allCallStackFrames: filteredFrames.slice(firstFirstPartyFrameIndex + 1),
      }
    }, [error.frames])

  const [all, setAll] = React.useState(firstFrame === null)

  const {
    canShowMore,
    leadingFramesGroupedByFramework,
    stackFramesGroupedByFramework,
  } = React.useMemo(() => {
    const leadingFrames = allLeadingFrames.filter((f) => f.expanded || all)
    const visibleCallStackFrames = allCallStackFrames.filter(
      (f) => f.expanded || all
    )

    return {
      canShowMore:
        allCallStackFrames.length !== visibleCallStackFrames.length ||
        (all && firstFrame !== null),

      stackFramesGroupedByFramework:
        groupStackFramesByFramework(allCallStackFrames),

      leadingFramesGroupedByFramework:
        groupStackFramesByFramework(leadingFrames),
    }
  }, [all, allCallStackFrames, allLeadingFrames, firstFrame])

  return (
    <>
      {firstFrame ? (
        <>
          <GroupedStackFrames
            groupedStackFrames={leadingFramesGroupedByFramework}
            show={all}
          />
          <CodeFrame
            stackFrame={firstFrame.originalStackFrame!}
            codeFrame={firstFrame.originalCodeFrame!}
          />
        </>
      ) : null}

      {error.componentStackFrames?.map((componentStackFrame, index) => (
        <ComponentStackFrameRow
          key={index}
          componentStackFrame={componentStackFrame}
        />
      ))}

      {stackFramesGroupedByFramework.length ? (
        <GroupedStackFrames
          groupedStackFrames={stackFramesGroupedByFramework}
          show={all}
        />
      ) : null}

      {canShowMore ? (
        <button
          tabIndex={10}
          data-nextjs-data-runtime-error-collapsed-action
          type="button"
          onClick={() => setAll(!all)}
        >
          {all ? 'Hide' : 'Show'} collapsed frames
        </button>
      ) : null}
    </>
  )
}

export const styles = css`
  button[data-nextjs-data-runtime-error-collapsed-action] {
    background: none;
    border: none;
    font-size: var(--size-font-small);
    line-height: var(--size-font-bigger);
    color: var(--color-accents-3);
    text-decoration: underline dotted;
    align-self: start;
  }

  [data-nextjs-call-stack-frame] > h3,
  [data-nextjs-component-stack-frame] > h3 {
    margin-top: 0;
    font-family: var(--font-stack-monospace);
    font-size: var(--size-font);
    color: #222;
  }
  [data-nextjs-call-stack-frame] > h3[data-nextjs-frame-expanded='false'] {
    color: var(--color-stack-headline);
  }
  [data-nextjs-call-stack-frame] > div,
  [data-nextjs-component-stack-frame] > div {
    display: flex;
    align-items: center;
    padding-left: calc(var(--size-gap) + var(--size-gap-half));
    font-size: var(--size-font-small);
    color: var(--color-stack-subline);
  }
  [data-nextjs-call-stack-frame] > div > svg,
  [data-nextjs-component-stack-frame] > [role='link'] > svg {
    width: auto;
    height: var(--size-font-small);
    margin-left: var(--size-gap);
    flex-shrink: 0;

    display: none;
  }

  [data-nextjs-call-stack-frame] > div[data-has-source],
  [data-nextjs-component-stack-frame] > [role='link'] {
    cursor: pointer;
  }
  [data-nextjs-call-stack-frame] > div[data-has-source]:hover,
  [data-nextjs-component-stack-frame] > [role='link']:hover {
    text-decoration: underline dotted;
  }
  [data-nextjs-call-stack-frame] > div[data-has-source] > svg,
  [data-nextjs-component-stack-frame] > [role='link'] > svg {
    display: unset;
  }

  [data-nextjs-call-stack-framework-icon] {
    margin-right: var(--size-gap);
  }
  [data-nextjs-call-stack-framework-icon='next'] > mask {
    mask-type: alpha;
  }
  [data-nextjs-call-stack-framework-icon='react'] {
    color: rgb(20, 158, 202);
  }
  [data-nextjs-collapsed-call-stack-details][open]
    [data-nextjs-call-stack-chevron-icon] {
    transition: transform 0.2s ease;
    transform: rotate(90deg);
  }
  [data-nextjs-collapsed-call-stack-details] > * {
    padding-left: var(--size-gap-double);
  }
  [data-nextjs-collapsed-call-stack-details] summary {
    display: flex;
    align-items: center;
    padding-left: 0;
    list-style: none;
  }
  [data-nextjs-collapsed-call-stack-details] summary::-webkit-details-marker {
    display: none;
  }

  [data-nextjs-collapsed-call-stack-details] h3 {
    color: var(--color-stack-headline);
  }
  [data-nextjs-collapsed-call-stack-details] [data-nextjs-call-stack-frame] {
    margin-bottom: var(--size-gap-double);
  }
`
