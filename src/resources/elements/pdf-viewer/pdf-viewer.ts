import { autoinject, bindable } from "aurelia-framework";
import { DOM } from "aurelia-pal";
import { base64StringToBlob } from "blob-util";
import * as pdfjsLib from "pdfjs-dist";

@autoinject
export class PdfViewer {
  @bindable public fileContents: string;
  @bindable public fileDownloadName: string;

  public scale = 1.5;
  public pdfData: string;
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public pageNumPending: number = null;
  public pdfDoc: pdfjsLib.PDFDocumentProxy;
  public pageNumber: number = 1;
  public pageCount: number;
  public pageRendering = false;
  public showPageNumbers = false;

  public documentLink: string;

  constructor(
    private el: Element,
    private dom = DOM
  ) { }

  protected async bind() {
    this.pdfData = atob(this.fileContents);
    await this.loadDocument();

    this.documentLink = this.createDownloadLink();
  }

  protected async loadDocument() {
    this.pdfDoc = await pdfjsLib.getDocument({ data: this.pdfData }).promise;
    this.canvas = this.dom.getElementById("pdf") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d");
    await this.renderPage(1);
  }

  protected async renderPage(num: number) {
    this.pageRendering = true;
    const page = await this.pdfDoc.getPage(num);
    this.pageCount = this.pdfDoc.numPages;
    this.showPageNumbers = this.pageCount > 1;

    const container = this.el.querySelector(".viewerContainer");
    const scale = container.clientWidth / page.getViewport({ scale: 1 }).width;

    const viewport = page.getViewport({ scale });

    this.canvas.height = viewport.height;
    this.canvas.width = viewport.width;

    const renderContext = {
      canvasContext: this.ctx,
      viewport
    };

    const renderTask = page.render(renderContext);
    await renderTask.promise;
    this.pageRendering = false;
    if (this.pageNumPending !== null) {
      await this.renderPage(this.pageNumPending);
      this.pageNumPending = null;
    }
  }

  protected async pagePrevious() {
    if (this.pageNumber <= 1) {
      return;
    }
    this.pageNumber--;
    await this.queueRenderPage();
  }

  protected async pageNext() {
    if (this.pageNumber >= this.pdfDoc.numPages) {
      return;
    }
    this.pageNumber++;
    await this.queueRenderPage();
  }

  protected createDownloadLink() {
    const newBlob = new Blob([base64StringToBlob(this.fileContents)], { type: "application/pdf" });
    const data = URL.createObjectURL(newBlob);
    return data;
  }

  private async queueRenderPage() {
    if (this.pageRendering) {
      this.pageNumPending = this.pageNumber;
    } else {
      await this.renderPage(this.pageNumber);
    }
  }
}
