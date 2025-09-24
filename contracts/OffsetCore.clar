(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-TRIP-HASH u101)
(define-constant ERR-INVALID-EMISSIONS u102)
(define-constant ERR-INVALID-PROJECT-ID u103)
(define-constant ERR-INVALID-PAYMENT u104)
(define-constant ERR-PROJECT-NOT-REGISTERED u105)
(define-constant ERR-OFFSET-ALREADY-EXISTS u106)
(define-constant ERR-OFFSET-NOT-FOUND u107)
(define-constant ERR-INVALID-TIMESTAMP u108)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u109)
(define-constant ERR-INVALID-MIN-OFFSET u110)
(define-constant ERR-INVALID-MAX-OFFSET u111)
(define-constant ERR-OFFSET-UPDATE-NOT-ALLOWED u112)
(define-constant ERR-INVALID-UPDATE-PARAM u113)
(define-constant ERR-MAX-OFFSETS-EXCEEDED u114)
(define-constant ERR-INVALID-OFFSET-TYPE u115)
(define-constant ERR-INVALID-VERIFICATION-LEVEL u116)
(define-constant ERR-INVALID-LOCATION u117)
(define-constant ERR-INVALID-CURRENCY u118)
(define-constant ERR-INVALID-STATUS u119)
(define-constant ERR-INVALID-TRAVELER u120)
(define-constant ERR-INSUFFICIENT-FUNDS u121)
(define-constant ERR-NFT-MINT-FAILED u122)
(define-constant ERR-PROJECT-FULL u123)
(define-constant ERR-INVALID-DURATION u124)
(define-constant ERR-INVALID-CATEGORY u125)

(define-data-var next-offset-id uint u0)
(define-data-var max-offsets uint u10000)
(define-data-var offset-fee uint u500)
(define-data-var authority-contract (optional principal) none)
(define-data-var nft-contract (optional principal) none)
(define-data-var project-registry-contract (optional principal) none)

(define-map offsets
  uint
  {
    traveler: principal,
    trip-hash: (buff 32),
    emissions: uint,
    project-id: uint,
    payment-amount: uint,
    timestamp: uint,
    offset-type: (string-utf8 50),
    verification-level: uint,
    location: (string-utf8 100),
    currency: (string-utf8 20),
    status: bool,
    min-offset: uint,
    max-offset: uint,
    duration: uint,
    category: (string-utf8 50)
  }
)

(define-map offsets-by-hash
  (buff 32)
  uint)

(define-map offset-updates
  uint
  {
    update-emissions: uint,
    update-payment-amount: uint,
    update-timestamp: uint,
    updater: principal
  }
)

(define-read-only (get-offset (id uint))
  (map-get? offsets id)
)

(define-read-only (get-offset-updates (id uint))
  (map-get? offset-updates id)
)

(define-read-only (is-offset-registered (hash (buff 32)))
  (is-some (map-get? offsets-by-hash hash))
)

(define-private (validate-trip-hash (hash (buff 32)))
  (if (is-eq (len hash) u32)
      (ok true)
      (err ERR-INVALID-TRIP-HASH))
)

(define-private (validate-emissions (emissions uint))
  (if (> emissions u0)
      (ok true)
      (err ERR-INVALID-EMISSIONS))
)

(define-private (validate-project-id (id uint))
  (if (> id u0)
      (ok true)
      (err ERR-INVALID-PROJECT-ID))
)

(define-private (validate-payment (amount uint))
  (if (> amount u0)
      (ok true)
      (err ERR-INVALID-PAYMENT))
)

(define-private (validate-offset-type (type (string-utf8 50)))
  (if (or (is-eq type "flight") (is-eq type "drive") (is-eq type "hotel"))
      (ok true)
      (err ERR-INVALID-OFFSET-TYPE))
)

(define-private (validate-verification-level (level uint))
  (if (<= level u3)
      (ok true)
      (err ERR-INVALID-VERIFICATION-LEVEL))
)

(define-private (validate-location (loc (string-utf8 100)))
  (if (and (> (len loc) u0) (<= (len loc) u100))
      (ok true)
      (err ERR-INVALID-LOCATION))
)

(define-private (validate-currency (cur (string-utf8 20)))
  (if (or (is-eq cur "STX") (is-eq cur "sSTX"))
      (ok true)
      (err ERR-INVALID-CURRENCY))
)

(define-private (validate-min-offset (min uint))
  (if (> min u0)
      (ok true)
      (err ERR-INVALID-MIN-OFFSET))
)

(define-private (validate-max-offset (max uint))
  (if (> max u0)
      (ok true)
      (err ERR-INVALID-MAX-OFFSET))
)

(define-private (validate-duration (dur uint))
  (if (> dur u0)
      (ok true)
      (err ERR-INVALID-DURATION))
)

(define-private (validate-category (cat (string-utf8 50)))
  (if (or (is-eq cat "carbon") (is-eq cat "renewable") (is-eq cat "reforest"))
      (ok true)
      (err ERR-INVALID-CATEGORY))
)

(define-private (validate-principal (p principal))
  (if (not (is-eq p 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-NOT-AUTHORIZED))
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (try! (validate-principal contract-principal))
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-nft-contract (contract-principal principal))
  (begin
    (try! (validate-principal contract-principal))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set nft-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-project-registry-contract (contract-principal principal))
  (begin
    (try! (validate-principal contract-principal))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set project-registry-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-max-offsets (new-max uint))
  (begin
    (asserts! (> new-max u0) (err ERR-INVALID-MAX-OFFSET))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set max-offsets new-max)
    (ok true)
  )
)

(define-public (set-offset-fee (new-fee uint))
  (begin
    (asserts! (>= new-fee u0) (err ERR-INVALID-UPDATE-PARAM))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set offset-fee new-fee)
    (ok true)
  )
)

(define-public (offset-trip
  (trip-hash (buff 32))
  (emissions uint)
  (project-id uint)
  (payment-amount uint)
  (offset-type (string-utf8 50))
  (verification-level uint)
  (location (string-utf8 100))
  (currency (string-utf8 20))
  (min-offset uint)
  (max-offset uint)
  (duration uint)
  (category (string-utf8 50))
)
  (let (
        (next-id (var-get next-offset-id))
        (current-max (var-get max-offsets))
        (authority (var-get authority-contract))
        (nft (var-get nft-contract))
        (registry (var-get project-registry-contract))
      )
    (asserts! (< next-id current-max) (err ERR-MAX-OFFSETS-EXCEEDED))
    (try! (validate-trip-hash trip-hash))
    (try! (validate-emissions emissions))
    (try! (validate-project-id project-id))
    (try! (validate-payment payment-amount))
    (try! (validate-offset-type offset-type))
    (try! (validate-verification-level verification-level))
    (try! (validate-location location))
    (try! (validate-currency currency))
    (try! (validate-min-offset min-offset))
    (try! (validate-max-offset max-offset))
    (try! (validate-duration duration))
    (try! (validate-category category))
    (asserts! (is-none (map-get? offsets-by-hash trip-hash)) (err ERR-OFFSET-ALREADY-EXISTS))
    (asserts! (is-some registry) (err ERR-PROJECT-NOT-REGISTERED))
    (let ((authority-recipient (unwrap! authority (err ERR-AUTHORITY-NOT-VERIFIED))))
      (try! (stx-transfer? (var-get offset-fee) tx-sender authority-recipient))
    )
    (asserts! (>= (as-contract (contract-call? (unwrap! registry (err ERR-PROJECT-NOT-REGISTERED)) get-project project-id)) u0) (err ERR-PROJECT-NOT-REGISTERED))
    (asserts! (is-some nft) (err ERR-NFT-MINT-FAILED))
    (try! (as-contract (contract-call? (unwrap! nft (err ERR-NFT-MINT-FAILED)) mint-eco-pass tx-sender next-id emissions)))
    (map-set offsets next-id
      {
        traveler: tx-sender,
        trip-hash: trip-hash,
        emissions: emissions,
        project-id: project-id,
        payment-amount: payment-amount,
        timestamp: block-height,
        offset-type: offset-type,
        verification-level: verification-level,
        location: location,
        currency: currency,
        status: true,
        min-offset: min-offset,
        max-offset: max-offset,
        duration: duration,
        category: category
      }
    )
    (map-set offsets-by-hash trip-hash next-id)
    (var-set next-offset-id (+ next-id u1))
    (print { event: "offset-created", id: next-id })
    (ok next-id)
  )
)

(define-public (update-offset
  (offset-id uint)
  (update-emissions uint)
  (update-payment-amount uint)
)
  (let ((offset (map-get? offsets offset-id)))
    (match offset
      o
        (begin
          (asserts! (is-eq (get traveler o) tx-sender) (err ERR-NOT-AUTHORIZED))
          (try! (validate-emissions update-emissions))
          (try! (validate-payment update-payment-amount))
          (map-set offsets offset-id
            (merge o {
              emissions: update-emissions,
              payment-amount: update-payment-amount,
              timestamp: block-height
            })
          )
          (map-set offset-updates offset-id
            {
              update-emissions: update-emissions,
              update-payment-amount: update-payment-amount,
              update-timestamp: block-height,
              updater: tx-sender
            }
          )
          (print { event: "offset-updated", id: offset-id })
          (ok true)
        )
      (err ERR-OFFSET-NOT-FOUND)
    )
  )
)

(define-public (check-offset-status (id uint))
  (let ((offset (map-get? offsets id)))
    (match offset
      o (ok (get status o))
      (err ERR-OFFSET-NOT-FOUND)
    )
  )
)

(define-public (get-offset-count)
  (ok (var-get next-offset-id))
)

(define-public (allocate-funds-to-project (offset-id uint) (project-id uint))
  (let ((offset (map-get? offsets offset-id)))
    (match offset
      o
        (begin
          (asserts! (is-eq (get project-id o) project-id) (err ERR-INVALID-PROJECT-ID))
          (asserts! (is-eq tx-sender (unwrap! (var-get authority-contract) (err ERR-AUTHORITY-NOT-VERIFIED))) (err ERR-NOT-AUTHORIZED))
          (try! (as-contract (stx-transfer? (get payment-amount o) tx-sender (get traveler o))))
          (print { event: "funds-allocated", offset-id: offset-id, project-id: project-id })
          (ok true)
        )
      (err ERR-OFFSET-NOT-FOUND)
    )
  )
)