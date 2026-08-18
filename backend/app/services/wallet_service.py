from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.money import to_decimal
from app.models.transaction import Transaction
from app.models.user import User


class InsufficientBalanceError(Exception):
    pass


class WalletService:
    @staticmethod
    def get_balance(db: Session, user_id: str) -> Decimal:
        user = db.get(User, user_id)
        if not user:
            raise ValueError("User not found")
        return to_decimal(user.balance)

    @staticmethod
    def deposit(
        db: Session,
        user_id: str,
        amount: float,
        description: str | None = None,
        *,
        bet_id: str | None = None,
        tx_type: str = "deposit",
    ) -> Transaction:
        dec_amount = to_decimal(amount)
        if dec_amount <= 0:
            raise ValueError("Amount must be positive")

        user = db.get(User, user_id)
        if not user:
            raise ValueError("User not found")

        user.balance = to_decimal(user.balance) + dec_amount
        tx = Transaction(
            user_id=user_id,
            bet_id=bet_id,
            type=tx_type,
            amount=dec_amount,
            description=description,
        )
        db.add(tx)
        db.add(user)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def withdraw(
        db: Session,
        user_id: str,
        amount: float,
        description: str | None = None,
        *,
        bet_id: str | None = None,
        tx_type: str = "withdraw",
    ) -> Transaction:
        dec_amount = to_decimal(amount)
        if dec_amount <= 0:
            raise ValueError("Amount must be positive")

        user = db.get(User, user_id)
        if not user:
            raise ValueError("User not found")

        balance = to_decimal(user.balance)
        if balance < dec_amount:
            raise InsufficientBalanceError("Insufficient balance")

        user.balance = balance - dec_amount
        tx = Transaction(
            user_id=user_id,
            bet_id=bet_id,
            type=tx_type,
            amount=-dec_amount,
            description=description,
        )
        db.add(tx)
        db.add(user)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def debit_for_bet(
        db: Session,
        user_id: str,
        amount: Decimal,
        bet_id: str,
        description: str,
    ) -> Transaction:
        user = db.get(User, user_id)
        if not user:
            raise ValueError("User not found")

        balance = to_decimal(user.balance)
        if balance < amount:
            raise InsufficientBalanceError("Insufficient balance")

        user.balance = balance - amount
        tx = Transaction(
            user_id=user_id,
            bet_id=bet_id,
            type="bet",
            amount=-amount,
            description=description,
        )
        db.add(tx)
        db.add(user)
        return tx

    @staticmethod
    def credit_winnings(
        db: Session,
        user_id: str,
        amount: Decimal,
        bet_id: str,
        description: str,
    ) -> Transaction:
        user = db.get(User, user_id)
        if not user:
            raise ValueError("User not found")

        user.balance = to_decimal(user.balance) + amount
        tx = Transaction(
            user_id=user_id,
            bet_id=bet_id,
            type="win",
            amount=amount,
            description=description,
        )
        db.add(tx)
        db.add(user)
        return tx

    @staticmethod
    def list_transactions(db: Session, user_id: str) -> list[Transaction]:
        return (
            db.query(Transaction)
            .filter(Transaction.user_id == user_id)
            .order_by(Transaction.created_at.desc())
            .all()
        )
