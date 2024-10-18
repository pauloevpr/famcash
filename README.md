# TODO

## Bugs

- The "Spending" tab does not show categories that don't have expenses in the selected month

## Features
- [ ] Auth
    - [ ] Google
    - [ ] Email link
- [ ] Collaboration
    - [ ] Invite others to join profile
    - [ ] Join profile from invitation
    - [ ] List members of a profile
    - [ ] Remove member from profile
- [x] Transactions
    - [x] View transactions summary for a given month:
        - [x] total expenses
        - [x] total income
        - [x] total
        - [x] carry over
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
- [ ] Accounts
    - [x] List accounts
    - [ ] Add account
    - [ ] Edit account
    - [ ] Delete unlikend account
