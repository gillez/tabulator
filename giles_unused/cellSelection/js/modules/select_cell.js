// YoYottaID Web Client
//
// Author: Giles Ellis
// Created: 4th Jan 2019
// Copyright © 2019 YoYotta. All rights reserved.
//

///////////////////////////////////////////////////////////////////////////////////////////////
// Tabulator module to allow Cell selection,
// Unlike selectRow, there are no key/mouse event handlers.  All selection should be done
// through cell.select() or Tabulator.prototype.selectCell() calls (and the corresponding deselect)
// Also (as selecting is only done from code), there is no "isSelectable" option or check.
///////////////////////////////////////////////////////////////////////////////////////////////

var SelectCell = function(table){
	this.table = table; //hold Tabulator object
	this.selectedCells = []; //hold selected cells
};

SelectCell.prototype.clearSelectionData = function(silent){
	this.selectedCells = [];

	if(!silent){
		this._cellSelectionChanged();
	}
};

SelectCell.prototype.initializeCell = function(cell){
	cell.modules.select = {selected:false};
};

//toggle cell selection
SelectCell.prototype.toggleCell = function(cell, checkRow){
	if(cell.modules.select.selected){
		this._deselectCell(cell, false, checkRow);
	}else{
		this._selectCell(cell, false, checkRow);
	}
};

// select a number of cells
// Unlike rows you cannot select all cells with this function.  Use selectRows if selecting all data is required.
// Select all cells may be added later.
SelectCell.prototype.selectCells = function(cells, checkRows){
	var self = this,
	rows,
	row;

	switch(typeof cells){
		case "undefined":
		console.error("Tabulator selectCells: must be passed a cell selector");
		break;

		case "boolean":
		console.error("Tabulator selectCells: boolean argument not handled, must be passed a cell selector");
		break;

		default:
		if(Array.isArray(cells)){
			rows = [];
			cells.forEach(function(cell){
				self._selectCell(cell, true, false);
				if (checkRows) {
					var row = self.getCell(cell).row;
					if (!rows.includes(row)) {
						rows.push(row);
					}
				}

			});

			self._cellSelectionChanged();

			if (checkRows) {
				rows = rows.filter(function(row) {
					return !row.getElement().classList.contains("tabulator-selected-cells");
				});
				if (rows.length > 0) {
					rows.forEach(function(row) {
						row.getElement().classList.add("tabulator-selected-cells");
					});
					self.table.modules.selectRow.selectRows(rows);
				}
			}
		}else{
			self._selectCell(cells, false, checkRows);
		}
		break;
	}
};

//select an individual cell
// Note: as there is no cell_manager, cells can only be selected by passing Cell or CellComponent objects.
// Unlike rows, they can't be selected from an ID or DOM element.
// Also, not handle max cell count and rolling selection
SelectCell.prototype._selectCell = function(cellInfo, silent, checkRow){
	var cell = this.getCell(cellInfo),
	rowEl;

	if(cell){
		if(this.selectedCells.indexOf(cell) == -1){
			cell.modules.select.selected = true;
			cell.getElement().classList.add("tabulator-selected");

			this.selectedCells.push(cell);

			if(!silent){
				this.table.options.cellSelected.call(this.table, cell.getComponent());
				this._cellSelectionChanged();
			}

			if (checkRow) {
				rowEl = cell.row.getElement();

				if (!rowEl.classList.contains("tabulator-selected-cells")) {
					rowEl.classList.add("tabulator-selected-cells");
					this.table.modules.selectRow.selectRows(cell.row);
				}
			}
		}
	}else{
		if(!silent){
			console.warn("Selection Error - No such cell found, ignoring selection:" + cellInfo);
		}
	}
};

SelectCell.prototype.isCellSelected = function(cell){
	return this.selectedCells.indexOf(cell) !== -1;
};

//deselect a number of cells
SelectCell.prototype.deselectCells = function(cells, checkRows){
	var self = this,
	cellCount,
	rows,
	row;

	if(typeof cells == "undefined"){

		cellCount = self.selectedCells.length;

		for(let i = 0; i <cellCount; i++){
			self._deselectCell(self.selectedCells[0], true, false);
		}

		self._cellSelectionChanged();

		if (checkRows) {
			self.table.deselectRow();
		}
	}else{
		if(Array.isArray(cells)){
			rows = [];

			cells.forEach(function(cell){
				self._deselectCell(cell, true, false);
				if (checkRows) {
					row = self.getCell(cell).row;
					if (!rows.includes(row)) {
						rows.push(row);
					}
				}
			});

			self._cellSelectionChanged();

			if (checkRows) {
				rows = rows.filter(function(row) {
					return !self._rowContainsSelectedCells(row);
				});
				if (rows.length > 0) {
					self.table.modules.selectRow.deselectRows(rows);
				}
			}
		}else{
			self._deselectCell(cells, false, checkRows);
		}

	}
};

//deselect an individual cell
SelectCell.prototype._deselectCell = function(cellInfo, silent, checkRow){
	var self = this,
	cell = this.getCell(cellInfo),
	index;

	if(cell){
		index = self.selectedCells.findIndex(function(selectedCell){
			return selectedCell == cell;
		});

		if(index > -1){
			cell.modules.select.selected = false;
			cell.getElement().classList.remove("tabulator-selected");
			self.selectedCells.splice(index, 1);

			if(!silent){
				self.table.options.cellDeselected.call(this.table, cell.getComponent());
				self._cellSelectionChanged();
			}

			if (checkRow) {
				if (!self._rowContainsSelectedCells(cell.row)) {
					self.table.modules.selectRow.deselectRows(cell.row);
				}
			}
		}
	}else{
		if(!silent){
			console.warn("Deselection Error - No such cell found, ignoring selection:" + cellInfo);
		}
	}
};

SelectCell.prototype._rowContainsSelectedCells = function(row) {
	return row.cells.some(cell => cell.modules.select.selected);
};

SelectCell.prototype.getCell = function(subject) {
	if(typeof subject == "object"){
		if(subject instanceof Cell){
			//subject is cell element
			return subject;
		}else if(subject instanceof CellComponent){
			//subject is public cell component
			return subject._getSelf() || false;
		}
	}
	return false;
};


SelectCell.prototype.getSelectedCells = function(){
	var cells = [];

	this.selectedCells.forEach(function(cell){
		cells.push(cell.getComponent());
	});

	return cells;
};

SelectCell.prototype._cellSelectionChanged = function(){
	this.table.options.cellSelectionChanged.call(this.table, this.getSelectedCells());
};

Tabulator.prototype.registerModule("selectCell", SelectCell);
