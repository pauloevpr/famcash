# TODO


## Issues

- fix: local storage settings are not being separated by user id (e.g. tab selection on home page)
- Fix: auth: session expiration should auto extend as requests come in
- Fix: many <input> have min instead of minlenght for text validation
- Spending category item is missing progress bar
- site images need more quality
- all pages dont handle empty state 

- The buttons that make API calls are missing:
    - loading indicators
        - only displays if it takes longer than 100ms, then shows for at least 300ms
    - error handling
- all forms dont use useSubmission for error handling, loading indicator, prevent concurrency
- TBD: should we delete the idb database on logout?
- TDB: should we validate all the data types (transactions, accounts, etc)?
- TDB: should we only accept alpha chars for IDs?

## Features
- [ ] Auth
    - [x] Google
    - [ ] Login with email 
        - [x] Basic login workflow
        - [x] Basic signup workflow
        - [x] Send login link email
        - [ ] Require Captcha to avoid spammers
   - [x] Logoff
- [ ] Collaboration
    - [x] Invite others to join family
    - [x] Join family from QR code
    - [x] List members of a family
    - [ ] Remove member from family
    - [ ] Switch between families
- [ ] Internationalization
    - [x] Format monetary values using user-selected currency
    - [ ] Support multiple display languages
        - [ ] English
- [x] Data Sync (using solid-wire)
- [ ] E2E encryption
- [ ] Transactions
    - [ ] View transactions summary for a given month:
        - [x] total expenses
        - [x] total income
        - [x] total
        - [x] carry over
        - [ ] Show explanation of how forecast is calculated
    - [x] List transactions for a given month
    - [x] Add transaction
    - [x] Delete Transaction
    - [x] Edit Transaction
- [x] Carryover
    - [x] View total carryover for a given account and month
    - [x] Manually set carryover amount for a given month and account
- [ ] Recurrent Transactions
    - [x] Add recurrent transaction
        - [x] recurrency length: week, month, year
        - [x] recurrency multiplier: 1-32
        - [x] e.g. every 2 weeks
    - [ ] Edit single occurrence 
    - [x] Edit all future occurrences
    - [ ] Delete single occurrence 
    - [x] Delete all future occurrences
    - [x] Take into account recurrent transactions when calculating the summary
- [ ] Categories
    - [x] List categories
    - [x] Add category
    - [ ] Edit category
        - [x] Basic category fields
        - [ ] Edit spending plan from edit form
    - [x] Delete unused category
    - [x] Add planned spending to category
    - [x] View spent summary for a given category and month
        - [x] total spent
        - [x] total planned
        - [x] remaining amount to spend
    - [x] View all expenses for a given category and month
- [ ] Payment plans
