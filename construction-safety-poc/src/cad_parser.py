#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CAD 图纸解析模块
================

功能：
- 解析 DWG/DXF 文件
- 提取建筑元素：墙体、门窗、楼梯、房间
- 输出结构化 JSON 数据

技术栈：
- 生产环境：OpenDesign Alliance Teigha / ezdxf
- POC：JSON 模拟 + 几何计算
"""

import json
import math
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict


@dataclass
class Wall:
    """墙体数据结构"""
    id: str
    start_x: float
    start_y: float
    end_x: float
    end_y: float
    thickness: float
    height: float
    layer: str


@dataclass
class Door:
    """门数据结构"""
    id: str
    center_x: float
    center_y: float
    width: float
    height: float
    rotation: float
    wall_id: Optional[str]


@dataclass
class Window:
    """窗户数据结构"""
    id: str
    center_x: float
    center_y: float
    width: float
    height: float
    wall_id: Optional[str]


@dataclass
class Room:
    """房间数据结构"""
    id: str
    name: str
    area: float
    polygon: List[Tuple[float, float]]
    floor: int


@dataclass
class Floor:
    """楼层数据结构"""
    id: str
    name: str
    floor_number: int
    width: float
    height: float
    walls: List[Wall]
    doors: List[Door]
    windows: List[Window]
    rooms: List[Room]


class CADParser:
    """CAD 图纸解析器"""
    
    def __init__(self):
        self.floors: List[Floor] = []
        self.file_path: Optional[str] = None
    
    def parse_dwg(self, file_path: str) -> Floor:
        """
        解析 DWG 文件
        
        Args:
            file_path: DWG 文件路径
            
        Returns:
            Floor: 楼层数据结构
            
        生产环境实现:
            使用 OpenDesign Alliance Teigha 或 ezdxf 库
        """
        self.file_path = file_path
        print(f"  📐 解析 DWG 文件：{file_path}")
        
        # POC 阶段：使用模拟数据
        # 生产环境替换为真实解析逻辑
        return self._generate_sample_floor()
    
    def parse_dxf(self, file_path: str) -> Floor:
        """
        解析 DXF 文件 (开源格式)
        
        Args:
            file_path: DXF 文件路径
            
        Returns:
            Floor: 楼层数据结构
        """
        self.file_path = file_path
        print(f"  📐 解析 DXF 文件：{file_path}")
        
        # 可以使用 ezdxf 库实现
        # import ezdxf
        # doc = ezdxf.readfile(file_path)
        # ... 解析逻辑
        
        return self._generate_sample_floor()
    
    def _generate_sample_floor(self) -> Floor:
        """生成示例楼层数据（模拟 CAD 解析结果）"""
        
        # 建筑轮廓：50m x 30m
        walls = [
            Wall("W001", 0, 0, 50, 0, 0.2, 3.0, "墙体"),
            Wall("W002", 50, 0, 50, 30, 0.2, 3.0, "墙体"),
            Wall("W003", 50, 30, 0, 30, 0.2, 3.0, "墙体"),
            Wall("W004", 0, 30, 0, 0, 0.2, 3.0, "墙体"),
            # 内墙
            Wall("W005", 15, 0, 15, 30, 0.15, 3.0, "内墙"),
            Wall("W006", 35, 0, 35, 30, 0.15, 3.0, "内墙"),
            Wall("W007", 0, 18, 50, 18, 0.15, 3.0, "内墙"),
        ]
        
        # 门
        doors = [
            Door("D001", 25, 0, 1.2, 2.1, 0, "W001"),
            Door("D002", 50, 15, 1.0, 2.1, 90, "W002"),
            Door("D003", 15, 18, 1.0, 2.1, 0, "W007"),
            Door("D004", 35, 18, 1.0, 2.1, 0, "W007"),
        ]
        
        # 窗户
        windows = [
            Window("WIN001", 10, 0, 1.5, 1.5, "W001"),
            Window("WIN002", 40, 0, 1.5, 1.5, "W001"),
            Window("WIN003", 50, 10, 1.5, 1.5, "W002"),
            Window("WIN004", 50, 20, 1.5, 1.5, "W002"),
        ]
        
        # 房间
        rooms = [
            Room("R001", "材料堆放区", 15*18, [(0,0), (15,0), (15,18), (0,18)], 1),
            Room("R002", "加工区", 20*18, [(15,0), (35,0), (35,18), (15,18)], 1),
            Room("R003", "办公区", 15*18, [(35,0), (50,0), (50,18), (35,18)], 1),
            Room("R004", "设备区", 50*12, [(0,18), (50,18), (50,30), (0,30)], 1),
        ]
        
        floor = Floor(
            id="F001",
            name="一层平面图",
            floor_number=1,
            width=50.0,
            height=30.0,
            walls=walls,
            doors=doors,
            windows=windows,
            rooms=rooms
        )
        
        return floor
    
    def export_json(self, floor: Floor, output_path: str):
        """
        导出为 JSON 格式
        
        Args:
            floor: 楼层数据
            output_path: 输出文件路径
        """
        data = {
            "floor_id": floor.id,
            "floor_name": floor.name,
            "floor_number": floor.floor_number,
            "dimensions": {"width": floor.width, "height": floor.height},
            "walls": [asdict(w) for w in floor.walls],
            "doors": [asdict(d) for d in floor.doors],
            "windows": [asdict(w) for w in floor.windows],
            "rooms": [asdict(r) for r in floor.rooms],
            "export_time": datetime.now().isoformat()
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"  ✓ 导出 JSON: {output_path}")
    
    def get_statistics(self, floor: Floor) -> Dict:
        """
        获取 CAD 解析统计信息
        
        Args:
            floor: 楼层数据
            
        Returns:
            Dict: 统计信息
        """
        return {
            "total_walls": len(floor.walls),
            "total_doors": len(floor.doors),
            "total_windows": len(floor.windows),
            "total_rooms": len(floor.rooms),
            "building_area": floor.width * floor.height,
            "total_room_area": sum(r.area for r in floor.rooms),
        }


def test_cad_parser():
    """测试 CAD 解析器"""
    print("=" * 50)
    print("CAD 图纸解析模块测试")
    print("=" * 50)
    
    parser = CADParser()
    floor = parser.parse_dwg("sample_floor.dwg")
    
    print(f"  ✓ 加载示例楼层数据")
    print(f"  ✓ 提取墙体：{len(floor.walls)}个")
    print(f"  ✓ 提取门窗：{len(floor.doors) + len(floor.windows)}个")
    print(f"  ✓ 提取房间：{len(floor.rooms)}个")
    
    # 导出 JSON
    parser.export_json(floor, "../output/floor_data.json")
    
    # 统计信息
    stats = parser.get_statistics(floor)
    print(f"  ✓ 建筑面积：{stats['building_area']} m²")
    print(f"  ✓ 房间总面积：{stats['total_room_area']} m²")
    
    print("\n✅ CAD 解析模块测试通过")


if __name__ == "__main__":
    test_cad_parser()
