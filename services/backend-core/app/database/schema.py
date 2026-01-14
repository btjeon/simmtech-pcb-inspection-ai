"""
Database schema for Customer Spec Management
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class CustomerSpec(Base):
    """고객 Spec 메인 테이블"""
    __tablename__ = 'customer_specs'
    __table_args__ = {"schema": "ai_spec_v2"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer = Column(String(100), nullable=False, index=True)  # SAMSUNG, SK hynix, etc.
    category3 = Column(String(50), nullable=False, index=True)  # BOC, MCP, eMMC, etc.
    customized = Column(String(100), default='None')  # None, Waiver, SAMSUNG, SK hynix, etc.
    rms_rev = Column(Integer, nullable=False)
    threshold = Column(Integer, default=1)
    rms_rev_datetime = Column(String(20), nullable=False)  # YYYYMMDDHHMMSS
    is_changed = Column(Boolean, default=False)
    max_rev = Column(Integer)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # 파일 원본 정보
    original_filename = Column(String(255))

    # Relationships
    defect_types = relationship("DefectType", back_populates="spec", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<CustomerSpec(customer='{self.customer}', category='{self.category3}', rev={self.rms_rev})>"


class DefectType(Base):
    """불량 유형 테이블"""
    __tablename__ = 'defect_types'
    __table_args__ = {"schema": "ai_spec_v2"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    spec_id = Column(Integer, ForeignKey('ai_spec_v2.customer_specs.id'), nullable=False)

    ai_code = Column(String(50), nullable=False, index=True)  # AF-283, AF-127, etc.
    side = Column(String(20))  # TOP, BOTTOM
    unit_dummy = Column(String(20))  # Unit, Dummy
    area = Column(String(100))  # 본드핑거, SR유닛, etc.
    defect_name = Column(String(100), nullable=False)  # 찍힘(눌림), 이물질, etc.
    multiple = Column(Integer)
    threshold_ok = Column(Float)
    threshold_ng = Column(Float)
    remark = Column(Text)

    # Relationships
    spec = relationship("CustomerSpec", back_populates="defect_types")
    defect_conditions = relationship("DefectCondition", back_populates="defect_type", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<DefectType(ai_code='{self.ai_code}', name='{self.defect_name}')>"


class DefectCondition(Base):
    """불량 조건 테이블"""
    __tablename__ = 'defect_conditions'
    __table_args__ = {"schema": "ai_spec_v2"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    defect_type_id = Column(Integer, ForeignKey('ai_spec_v2.defect_types.id'), nullable=False)

    idx = Column(Integer)
    machine_type = Column(String(50))  # None, P_5_5_C, etc.
    metal_value_percent = Column(Float)
    no_measurement_default_result = Column(String(50))  # AI_UNKNOWN_NONE, AI_OK, AI_NG, etc.

    # Relationships
    defect_type = relationship("DefectType", back_populates="defect_conditions")
    measurement_conditions = relationship("MeasurementCondition", back_populates="defect_condition", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<DefectCondition(id={self.id}, machine='{self.machine_type}')>"


class MeasurementCondition(Base):
    """측정 조건 테이블"""
    __tablename__ = 'measurement_conditions'
    __table_args__ = {"schema": "ai_spec_v2"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    defect_condition_id = Column(Integer, ForeignKey('ai_spec_v2.defect_conditions.id'), nullable=False)

    idx = Column(Integer)
    measurement_name = Column(String(100))
    default_result_value = Column(String(50))  # AI_OK, AI_NG, etc.
    root_logical_operator = Column(String(20))  # OR, AND
    measurement_condition_value = Column(Float)
    measurement_condition_unit = Column(String(50))
    measurement_condition_inequality_sign = Column(String(20))

    # Relationships
    defect_condition = relationship("DefectCondition", back_populates="measurement_conditions")
    specifications = relationship("Specification", back_populates="measurement_condition", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<MeasurementCondition(id={self.id}, name='{self.measurement_name}')>"


class Specification(Base):
    """사양 테이블 (복잡한 중첩 구조 지원)"""
    __tablename__ = 'specifications'
    __table_args__ = {"schema": "ai_spec_v2"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    measurement_condition_id = Column(Integer, ForeignKey('ai_spec_v2.measurement_conditions.id'), nullable=False)
    parent_spec_id = Column(Integer, ForeignKey('ai_spec_v2.specifications.id'), nullable=True)  # For SubSpecifications

    measurement_name = Column(String(100))  # longest, width, area, etc.
    unit = Column(String(50))  # MicroMeter, Pixel, etc.
    sub_logical_operator = Column(String(20))  # None, OR, AND

    # Relationships
    measurement_condition = relationship("MeasurementCondition", back_populates="specifications")
    parent_spec = relationship("Specification", remote_side=[id], backref="sub_specifications")
    expressions = relationship("Expression", back_populates="specification", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Specification(id={self.id}, name='{self.measurement_name}')>"


class Expression(Base):
    """표현식 테이블 (값과 부등호)"""
    __tablename__ = 'expressions'
    __table_args__ = {"schema": "ai_spec_v2"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    specification_id = Column(Integer, ForeignKey('ai_spec_v2.specifications.id'), nullable=False)

    value = Column(Float, nullable=False)
    inequality_sign = Column(String(20), nullable=False)  # gte, lte, gt, lt, eq

    # Relationships
    specification = relationship("Specification", back_populates="expressions")

    def __repr__(self):
        return f"<Expression(value={self.value}, sign='{self.inequality_sign}')>"
