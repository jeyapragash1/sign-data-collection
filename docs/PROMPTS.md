# Draft prompt import

The 10 demonstration Tamil sentences cover hospital reception (4), transport (3), and bank counters (3). They are **draft examples requiring researcher and sign-language review**, not validated translations. Teachers sign the displayed message, including a question's meaning; they do not answer it.

Operational word-count rule: `len(text.split())` after whitespace trimming. This is explicitly a whitespace-token rule, not linguistic Tamil word segmentation. Out-of-range drafts are flagged. Approval outside 3–10 tokens requires a researcher exception note.

Use UTF-8 CSV. Template columns:

`code,tamil,english,domain,status,intent,action,object,negation,quantity,time,location,exception_note`

Codes are stable ASCII letters/numbers/underscores/hyphens. Domains: hospital/transport/bank. Status: draft/approved/archived. Version numbers are server-generated per code. In admin Prompts & batches: select CSV → Validate / preview → inspect errors/count → Import validated rows. Invalid imports write nothing. Import always creates new versions; importing twice intentionally creates additional versions. Batch assignments are made separately by selecting exact versions and contributor codes. Drafts can only be assigned through the explicit draft pilot option.

Researchers should check sentence naturalness, intended meaning and essential semantic details with domain staff and sign-language teachers before approval. Sign language and regional variety are required in recording annotations, not inferred from Tamil or Northern Province location.
