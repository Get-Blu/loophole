// Normally you'd want to put these exports in the files that register them, but if you do that you'll get an import order error if you import them in certain cases.
// (importing them runs the whole file to get the ID, causing an import error). I guess it's best practice to separate out IDs, pretty annoying...

export const LOOPHOLE_CTRL_L_ACTION_ID = 'loophole.ctrlLAction'
export const LOOPHOLE_CTRL_K_ACTION_ID = 'loophole.ctrlKAction'

export const LOOPHOLE_ACCEPT_DIFF_ACTION_ID = 'loophole.acceptDiff'
export const LOOPHOLE_REJECT_DIFF_ACTION_ID = 'loophole.rejectDiff'

export const LOOPHOLE_GOTO_NEXT_DIFF_ACTION_ID = 'loophole.goToNextDiff'
export const LOOPHOLE_GOTO_PREV_DIFF_ACTION_ID = 'loophole.goToPrevDiff'

export const LOOPHOLE_GOTO_NEXT_URI_ACTION_ID = 'loophole.goToNextUri'
export const LOOPHOLE_GOTO_PREV_URI_ACTION_ID = 'loophole.goToPrevUri'

export const LOOPHOLE_ACCEPT_FILE_ACTION_ID = 'loophole.acceptFile'
export const LOOPHOLE_REJECT_FILE_ACTION_ID = 'loophole.rejectFile'

export const LOOPHOLE_ACCEPT_ALL_DIFFS_ACTION_ID = 'loophole.acceptAllDiffs'
export const LOOPHOLE_REJECT_ALL_DIFFS_ACTION_ID = 'loophole.rejectAllDiffs'
