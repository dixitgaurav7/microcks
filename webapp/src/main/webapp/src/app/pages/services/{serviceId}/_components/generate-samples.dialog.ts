/*
 * Licensed to Laurent Broudoux (the "Author") under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. Author licenses this
 * file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { BsModalRef } from 'ngx-bootstrap/modal';

import { AICopilotService } from '../../../../services/aicopilot.service';
import { Service, Exchange, RequestResponsePair } from '../../../../models/service.model';

@Component({
  selector: 'generate-samples-dialog',
  templateUrl: './generate-samples.dialog.html',
  styleUrls: ['./generate-samples.dialog.css']
})
export class GenerateSamplesDialogComponent implements OnInit {
  @Output() saveSamplesAction = new EventEmitter<Exchange[]>();

  closeBtnName: string;
  service: Service;
  operationName: string;

  infoMessage: string;
  errorMessage: string;
  saveEnabled: boolean = false;

  exchanges: Exchange[] = [];
  selectedExchanges: Exchange[] = [];
  exchangesNames: string[] = [];

  constructor(private copilotSvc: AICopilotService, public bsModalRef: BsModalRef) {}

  ngOnInit() {
    this.getSamplesSuggestions(2);
    /*
    this.exchanges.push({"request": {}, "response": {}});
    this.exchanges.push({"request": {}, "response": {}});
    this.selectedExchanges.push({"request": {}, "response": {}});
    this.infoMessage = 'You need to rename and may unselect samples before saving them';
    */
  }

  getSamplesSuggestions(numberOfSamples: number = 2): void {
    this.copilotSvc.getSamplesSuggestions(this.service, this.operationName, numberOfSamples)
        .subscribe(
          {
            next: res => {
              if (res.length == 0) {
                this.infoMessage = 'AI Copilot was not able to analyse your specification and provide samples in specified delay. Please retry later...'
              } else {
                res.forEach(exchange => exchange['type'] = "reqRespPair");
                this.exchanges.push(...res);
                this.selectedExchanges.push(...res);
                this.infoMessage = 'You need to rename and may unselect samples before saving them';
                this.errorMessage = undefined;
              }
            },
            error: err => {
              console.log('Observer got an error: ' + JSON.stringify(err));
              this.errorMessage = 'Got an error on server side: ' + err.error;
              this.infoMessage = undefined;
            },
            complete: () => console.log('Observer got a complete notification'),
          }
        );
  }

  getExchangeName(index: number): string {
    if (this.exchangesNames[index] === undefined) {
      return 'Sample ' + index;
    }
    return this.exchangesNames[index];
  }

  toggleSelectedExchange(index: number): void {
    if (this.selectedExchanges[index] == undefined) {
      this.selectedExchanges[index] = this.exchanges[index];
    } else {
      this.selectedExchanges[index] = undefined;
    }
    this.isSavingEnabled();
  }

  updateSampleName($event: Event, index: number): void {
    this.exchangesNames[index] = String($event);
    (this.exchanges[index] as RequestResponsePair).request.name = String($event);
    (this.selectedExchanges[index] as RequestResponsePair).request.name = String($event);
    this.isSavingEnabled();
  }

  isSavingEnabled(): void {
    var missingSomething = false;
    this.selectedExchanges.forEach((exchange, index) => {
      if (exchange != undefined) {
        if (this.exchangesNames[index] == undefined) {
          missingSomething = true;
        }
      }
    });
    this.saveEnabled = !missingSomething && this.selectedExchanges.length > 0;
  }

  saveSamples(): void {
    this.saveSamplesAction.emit(this.selectedExchanges);
    this.bsModalRef.hide();
  }
}
