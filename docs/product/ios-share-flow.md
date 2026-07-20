# iOS share flow — Sentient 1.1

## Product contract

A user can select or copy text in a supported iOS app, share it to Sentient, choose what help they need, copy a suggested reply, and return to the original conversation with clear instructions.

Sentient must not imply that iOS can always return directly to the exact source conversation. iOS does not expose a universal deep link back to the originating chat. The app may switch directly only when a verified app URL scheme is available.

## Supported entry flow

1. In the source app, select or copy the message.
2. Open the iOS Share Sheet.
3. Choose Sentient. If it is hidden, choose **More**, then add Sentient to favourites.
4. Sentient opens the Choose screen with the shared text.
5. Select **What can I do?** or **What am I missing?**.
6. Choose or edit a reply.
7. Copy the reply.
8. Return to the source chat and paste it.

## Behaviour rules

- Never claim that a message is sent automatically.
- Never promise a direct switch to an unknown source application.
- Use a direct app switch only for a tested URL scheme.
- When direct switching is unavailable, copy the reply and give a concise return-to-chat instruction.
- Keep manual paste/type entry available as a fallback.

## Device verification matrix

Test on a physical iPhone with:

- Messages / iMessage
- WhatsApp
- Messenger
- Mail
- Notes
- Safari selected text and shared URLs

For each source, record:

- whether Sentient appears in the Share Sheet
- whether the shared text is received intact
- whether a URL is received as expected
- cold-start behaviour
- warm-start behaviour
- copy behaviour
- direct-switch behaviour, if supported
- any source-app name exposed to Sentient
