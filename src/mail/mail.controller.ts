import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SendgridService } from 'src/sendgrid/sendgrid.service';
import { UserDto } from 'src/user/dto/user.dto';
import { EmailVerificationDTO } from './email.dto';
import { EMailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(
    private readonly sendgridService: SendgridService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EMailService,
  ) {}

  // Here we use query parameter to get the email that we want to send
  @Post('send-email')
  async sendEmail(@Res() res, @Body() body: UserDto) {
    // getting values out of body
    const { email, name, password } = body;
    // generate a JWT token
    const token = await this.jwtService.signAsync(
      { email, name, password },
      {
        secret: this.configService.get<string>('JWT_EMAIL_VERIFICATION'),
        expiresIn: '10h',
      },
    );

    // prepare a mail to send with details
    const mail = {
      to: email,
      subject: 'Verify your email address',
      from: 'swt@real-cnt.com', // Fill it with your validated email on SendGrid account
      text: 'Email verifiation email',
      html: `
        <div>
          <h1>Click this URL to verify your email address for registration.</h1> 
          <p>${this.configService.get<string>(
            'CLIENT_URL',
          )}/email_verification/${token}</p> 
        </div> 
      `,
    };

    // send mail with sendgreid API
    await this.sendgridService
      .send(mail)
      .then(() => {
        return res.status(HttpStatus.OK).json({
          message: 'OK, Email sent',
          status: 'OK',
        });
      })
      .catch((error) => {
        console.error(error);
        return res.status(HttpStatus.OK).json({
          message: 'NOT OK error occured.',
          status: 'NOT OK',
          error: error,
        });
      });
  }

  @Post('/email-verification')
  async emailVerification(@Body() body: EmailVerificationDTO) {
    return this.emailService.verifyEmail(body);
  }
}
