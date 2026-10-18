# Locked Celebration Auto-Advance

When a toddler completes an activity card on the Garden Vine, the interface triggers a 2-second celebration window (pentatonic chime, confetti burst, blooming animation) and smoothly scrolls to the next card. During this 2-second window and scroll transition, user input is temporarily locked.

## Context & Trade-off

Toddlers frequently rapid-tap or swipe screens in excitement upon achieving success. In testing mobile experiences for toddlers, allowing input during celebratory transitions causes accidental touches to cancel the rewards or trigger unintended double-skips down the feed. By locking input for exactly 2 seconds during the bloom and scroll transition, the child receives guaranteed positive reinforcement and lands cleanly centered on the next card without erratic viewport jumps.
