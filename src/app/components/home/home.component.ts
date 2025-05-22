import { Component, inject } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';

interface ExchangeRateData {
  exchangeRate: number;
  fromSymbol: string;
  lastUpdatedAt: string;
  rateLimitExceeded: boolean;
  success: boolean;
  toSymbol: string;
}

interface DailyExchangeRateData {
  open: number;
  high: number;
  low: number;
  close: number;
  closeDiff: number;
  formattedDate: string;
  date: string;
}

interface DailyExchangeRateResponse {
  success: boolean;
  from: string;
  to: string;
  lastUpdatedAt: string;
  data: DailyExchangeRateData[];
}


@Component({
  selector: 'app-home',
  imports: [HttpClientModule, CommonModule],
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})

export class HomeComponent {

  private http = inject(HttpClient);
  showExchangeResult: boolean = false;
  isLoading: boolean = false;
  emptyInput: boolean = false;
  showLastDays: boolean = false;
  exchangeRateData: ExchangeRateData = {
    exchangeRate: 0,
    fromSymbol: '',
    lastUpdatedAt: '',
    rateLimitExceeded: false,
    success: false,
    toSymbol: ''
  }
  dailyExchangeRateData: DailyExchangeRateResponse = {
    success: false,
    from: "string",
    to: "string",
    lastUpdatedAt: "string",
    data: []
  }

  formatDate(date: any, dateOnly: boolean = false): any {
    const data: Date = new Date(date);

    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      ...(dateOnly ? {} : {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo"
      }),
    });
  }

  async convertCurrency(currency: string) {
    if (currency === '') {
      this.emptyInput = true;

    } else {
      this.emptyInput = false;
      this.isLoading = true;
      try {
        const data: ExchangeRateData = await firstValueFrom(this.http.get<ExchangeRateData>(`https://api-brl-exchange.actionlabs.com.br/api/1.0/open/currentExchangeRate?apiKey=RVZG0GHEV2KORLNA&from_symbol=${currency}&to_symbol=BRL`));
        data.lastUpdatedAt = this.formatDate(data.lastUpdatedAt);
        this.exchangeRateData = data;
        this.isLoading = false;
        this.showExchangeResult = true;
      } catch (error) {
        console.error('Erro:', error);
      }
    }

  }

  async getLastThirtyDays(currency: string) {
    try {
      if (!this.showLastDays) {
        const data: DailyExchangeRateResponse = await firstValueFrom(
          this.http.get<DailyExchangeRateResponse>(
            `https://api-brl-exchange.actionlabs.com.br/api/1.0/open/dailyExchangeRate?apiKey=RVZG0GHEV2KORLNA&from_symbol=${currency}&to_symbol=BRL`
          )
        );

        const today: Date = new Date()
        const last31DaysData: DailyExchangeRateData[] = data.data.filter(
          (item) => new Date(item.date) <= today);

        const last30days: DailyExchangeRateData[] = last31DaysData.slice(0, 31);

        // Calcula closeDiff (comparando com o dia seguinte)
        for (let i = 0; i < last30days.length; i++) {
          const current: DailyExchangeRateData = last30days[i];
          const next: DailyExchangeRateData = last30days[i + 1]; // dia anterior cronologicamente

          if (next) {
            current.closeDiff = parseFloat(
              (((current.close - next.close) / next.close) * 100).toFixed(2)
            );
          }

          current.formattedDate = this.formatDate(current.date, true);

        }

        // Remove o último (mais antigo) para exibir só 30 dias
        const finalData: DailyExchangeRateData[] = last30days.slice(0, last30days.length - 1);

        this.dailyExchangeRateData = {
          ...data,
          data: finalData,
        };
      }

      this.showLastDays = !this.showLastDays;
    } catch (error) {
      console.error('Erro:', error);
    }
  }



}
