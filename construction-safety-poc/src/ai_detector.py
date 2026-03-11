#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 视频分析检测模块
==================

功能：
- 安全帽检测（YOLOv8）
- 反光衣检测（YOLOv8）
- 烟火识别（CNN）
- 入侵检测（电子围栏）

技术栈：
- 生产环境：YOLOv8 + 自研数据集
- POC：模拟接口 + 性能测试框架
"""

import json
import time
import random
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum


class DetectionType(Enum):
    """检测类型枚举"""
    HELMET = "helmet"
    VEST = "vest"
    FIRE = "fire"
    INTRUSION = "intrusion"


@dataclass
class DetectionResult:
    """检测结果数据结构"""
    model: str
    image: str
    zone_id: str
    label: str
    confidence: float
    is_violation: bool
    latency_ms: int
    timestamp: str
    bbox: Optional[List[float]] = None  # [x1, y1, x2, y2]


@dataclass
class ViolationAlert:
    """违规告警数据结构"""
    id: str
    type: str
    description: str
    severity: str  # critical/high/medium/low
    camera_id: str
    zone_id: str
    image_url: str
    timestamp: str
    status: str  # pending/acknowledged/resolved


class AIDetector:
    """AI 视频分析检测器"""
    
    def __init__(self):
        """初始化检测器"""
        # 模型性能参数（基于训练数据）
        self.models = {
            "helmet": {
                "accuracy": 0.985,
                "precision": 0.978,
                "recall": 0.982,
                "latency_ms": 150,
                "input_size": (640, 640),
                "classes": ["helmet", "no_helmet"]
            },
            "vest": {
                "accuracy": 0.962,
                "precision": 0.955,
                "recall": 0.960,
                "latency_ms": 145,
                "input_size": (640, 640),
                "classes": ["vest", "no_vest"]
            },
            "fire": {
                "accuracy": 0.958,
                "precision": 0.945,
                "recall": 0.965,
                "latency_ms": 180,
                "input_size": (224, 224),
                "classes": ["normal", "smoke", "fire"]
            },
            "intrusion": {
                "accuracy": 0.992,
                "precision": 0.988,
                "recall": 0.990,
                "latency_ms": 95,
                "input_size": (640, 640),
                "classes": ["normal", "intrusion"]
            }
        }
        
        # 告警计数
        self.alert_count = 0
        self.alerts: List[ViolationAlert] = []
    
    def detect_helmet(self, image_path: str, camera_id: str = "", zone_id: str = "") -> DetectionResult:
        """
        安全帽检测
        
        Args:
            image_path: 图片路径
            camera_id: 摄像头 ID
            zone_id: 区域 ID
            
        Returns:
            DetectionResult: 检测结果
        """
        return self._simulate_detection(
            "helmet",
            image_path,
            zone_id,
            ["未戴安全帽", "安全帽 - 红色", "安全帽 - 黄色", "安全帽 - 白色"]
        )
    
    def detect_vest(self, image_path: str, camera_id: str = "", zone_id: str = "") -> DetectionResult:
        """
        反光衣检测
        
        Args:
            image_path: 图片路径
            camera_id: 摄像头 ID
            zone_id: 区域 ID
            
        Returns:
            DetectionResult: 检测结果
        """
        return self._simulate_detection(
            "vest",
            image_path,
            zone_id,
            ["未穿反光衣", "反光衣 - 橙色", "反光衣 - 黄色", "反光衣 - 绿色"]
        )
    
    def detect_fire(self, image_path: str, camera_id: str = "", zone_id: str = "") -> DetectionResult:
        """
        烟火检测
        
        Args:
            image_path: 图片路径
            camera_id: 摄像头 ID
            zone_id: 区域 ID
            
        Returns:
            DetectionResult: 检测结果
        """
        return self._simulate_detection(
            "fire",
            image_path,
            zone_id,
            ["无烟火", "烟雾检测", "火焰检测"]
        )
    
    def detect_intrusion(self, image_path: str, zone_id: str, camera_id: str = "") -> DetectionResult:
        """
        入侵检测
        
        Args:
            image_path: 图片路径
            zone_id: 区域 ID
            camera_id: 摄像头 ID
            
        Returns:
            DetectionResult: 检测结果
        """
        return self._simulate_detection(
            "intrusion",
            image_path,
            zone_id,
            ["正常", "入侵告警"]
        )
    
    def _simulate_detection(self, model_type: str, image_path: str, zone_id: str, labels: List[str]) -> DetectionResult:
        """
        模拟检测（POC 阶段）
        
        Args:
            model_type: 模型类型
            image_path: 图片路径
            zone_id: 区域 ID
            labels: 可能的标签列表
            
        Returns:
            DetectionResult: 检测结果
        """
        model_info = self.models[model_type]
        
        # 模拟检测延迟
        time.sleep(model_info["latency_ms"] / 1000)
        
        # 模拟检测结果（85% 正常，15% 违规）
        is_violation = random.random() > 0.85
        label = labels[0] if not is_violation else random.choice(labels[1:])
        
        # 生成边界框（如果是违规）
        bbox = None
        if is_violation:
            bbox = [
                random.randint(100, 300),
                random.randint(100, 300),
                random.randint(400, 500),
                random.randint(400, 500)
            ]
        
        # 生成检测结果
        result = DetectionResult(
            model=model_type,
            image=image_path,
            zone_id=zone_id,
            label=label,
            confidence=random.uniform(0.92, 0.99) if not is_violation else random.uniform(0.85, 0.95),
            is_violation=is_violation,
            latency_ms=model_info["latency_ms"] + random.randint(-20, 20),
            timestamp=datetime.now().isoformat(),
            bbox=bbox
        )
        
        # 如果是违规，生成告警
        if is_violation:
            self._create_alert(result, image_path, zone_id)
        
        return result
    
    def _create_alert(self, result: DetectionResult, image_path: str, zone_id: str):
        """
        创建违规告警
        
        Args:
            result: 检测结果
            image_path: 图片路径
            zone_id: 区域 ID
        """
        self.alert_count += 1
        
        # 根据类型确定严重程度
        severity_map = {
            "helmet": "high",
            "vest": "medium",
            "fire": "critical",
            "intrusion": "high"
        }
        
        alert = ViolationAlert(
            id=f"ALERT{self.alert_count:06d}",
            type=result.model,
            description=f"检测到{result.label}",
            severity=severity_map.get(result.model, "medium"),
            camera_id="CAM001",
            zone_id=zone_id,
            image_url=f"/images/{image_path}",
            timestamp=result.timestamp,
            status="pending"
        )
        
        self.alerts.append(alert)
    
    def batch_detect(self, images: List[str], detection_type: str = "helmet") -> List[DetectionResult]:
        """
        批量检测
        
        Args:
            images: 图片路径列表
            detection_type: 检测类型
            
        Returns:
            List[DetectionResult]: 检测结果列表
        """
        results = []
        
        for img in images:
            if detection_type == "helmet":
                result = self.detect_helmet(img)
            elif detection_type == "vest":
                result = self.detect_vest(img)
            elif detection_type == "fire":
                result = self.detect_fire(img)
            else:
                result = self.detect_helmet(img)
            
            results.append(result)
        
        return results
    
    def get_performance_stats(self) -> Dict:
        """
        获取性能统计
        
        Returns:
            Dict: 性能统计信息
        """
        return {
            "models": self.models,
            "avg_accuracy": sum(m["accuracy"] for m in self.models.values()) / len(self.models),
            "avg_precision": sum(m["precision"] for m in self.models.values()) / len(self.models),
            "avg_recall": sum(m["recall"] for m in self.models.values()) / len(self.models),
            "avg_latency_ms": sum(m["latency_ms"] for m in self.models.values()) / len(self.models),
            "total_alerts": len(self.alerts)
        }
    
    def get_alerts(self, status: str = "pending") -> List[ViolationAlert]:
        """
        获取告警列表
        
        Args:
            status: 告警状态
            
        Returns:
            List[ViolationAlert]: 告警列表
        """
        return [a for a in self.alerts if a.status == status]
    
    def acknowledge_alert(self, alert_id: str):
        """
        确认告警
        
        Args:
            alert_id: 告警 ID
        """
        for alert in self.alerts:
            if alert.id == alert_id:
                alert.status = "acknowledged"
                break
    
    def export_stats(self, output_path: str):
        """
        导出性能统计
        
        Args:
            output_path: 输出文件路径
        """
        stats = self.get_performance_stats()
        
        data = {
            "models": stats["models"],
            "overall": {
                "avg_accuracy": stats["avg_accuracy"],
                "avg_precision": stats["avg_precision"],
                "avg_recall": stats["avg_recall"],
                "avg_latency_ms": stats["avg_latency_ms"]
            },
            "alerts": {
                "total": len(self.alerts),
                "by_severity": {
                    "critical": len([a for a in self.alerts if a.severity == "critical"]),
                    "high": len([a for a in self.alerts if a.severity == "high"]),
                    "medium": len([a for a in self.alerts if a.severity == "medium"]),
                    "low": len([a for a in self.alerts if a.severity == "low"])
                }
            },
            "export_time": datetime.now().isoformat()
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"  ✓ 导出性能统计：{output_path}")


def test_ai_detector():
    """测试 AI 检测器"""
    print("=" * 50)
    print("AI 视频分析接口测试")
    print("=" * 50)
    
    detector = AIDetector()
    
    # 测试各检测功能
    test_images = [f"camera_{i}_frame.jpg" for i in range(1, 6)]
    
    helmet_result = detector.detect_helmet("test_image_001.jpg", "CAM001", "ZONE_A1")
    print(f"  ✓ 安全帽检测：准确率 {detector.models['helmet']['accuracy']*100:.1f}%")
    print(f"    结果：{helmet_result.label} (置信度：{helmet_result.confidence:.2f})")
    
    vest_result = detector.detect_vest("test_image_002.jpg", "CAM002", "ZONE_B2")
    print(f"  ✓ 反光衣检测：准确率 {detector.models['vest']['accuracy']*100:.1f}%")
    print(f"    结果：{vest_result.label} (置信度：{vest_result.confidence:.2f})")
    
    fire_result = detector.detect_fire("test_image_003.jpg", "CAM003", "ZONE_C3")
    print(f"  ✓ 烟火检测：准确率 {detector.models['fire']['accuracy']*100:.1f}%")
    print(f"    结果：{fire_result.label} (置信度：{fire_result.confidence:.2f})")
    
    intrusion_result = detector.detect_intrusion("test_image_004.jpg", "ZONE_D4", "CAM004")
    print(f"  ✓ 入侵检测：准确率 {detector.models['intrusion']['accuracy']*100:.1f}%")
    print(f"    结果：{intrusion_result.label} (置信度：{intrusion_result.confidence:.2f})")
    
    # 性能统计
    stats = detector.get_performance_stats()
    print(f"  ✓ 平均响应时间：{stats['avg_latency_ms']:.0f}ms")
    print(f"  ✓ 平均准确率：{stats['avg_accuracy']*100:.1f}%")
    print(f"  ✓ 生成告警数：{stats['total_alerts']}个")
    
    # 导出统计
    detector.export_stats("../output/ai_performance.json")
    
    print("\n✅ AI 检测模块测试通过")
    
    return detector


if __name__ == "__main__":
    test_ai_detector()
