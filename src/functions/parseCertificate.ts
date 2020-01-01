import { Client } from '..';

export interface Certificate {
  subject: {
    commonName: string,
    emailAddress: string
    organizationName: string,
    organizationalUnitName: string,
    countryName: string,
  },
  issuer: {
    commonName: string
    emailAddress: null,
    organizationName: string,
    organizationalUnitName: string,
    countryName: string,
  },
  extensions: {
    keyUsage: '[ Not implemented by executable ]',
    extendedKeyUsage: string[],
    certificatePolicies: string[],
  },
  serial: string,
  fingerPrint: string,
  signatureAlgorithm: string,
  publicKeyAlgorithm: string,
  notBefore: Date,
  notAfter: Date,
}

export default async function parseCertificate(client: Client, pathToCertificate: string): Promise<Certificate> {
  const result = await client.util.exec(`${__dirname}/../bin/checkCertificate ${pathToCertificate}`);
  const parsedObject = JSON.parse(result);
  return {
    subject: {
      commonName: parsedObject.RawParse.Subject.CommonName,
      emailAddress: parsedObject.AbstractParse.EmailAddress,
      organizationName: parsedObject.RawParse.Subject.Organization ? parsedObject.RawParse.Subject.Organization[0] : null,
      organizationalUnitName: parsedObject.RawParse.Subject.OrganizationalUnit ? parsedObject.RawParse.Subject.OrganizationalUnit[0] : null,
      countryName: parsedObject.RawParse.Subject.Country ? parsedObject.RawParse.Subject.Country[0] : null,
    },
    issuer: {
      commonName: parsedObject.RawParse.Issuer.CommonName,
      emailAddress: null,
      organizationName: parsedObject.RawParse.Issuer.Organization ? parsedObject.RawParse.Issuer.Organization[0] : null,
      organizationalUnitName: parsedObject.RawParse.Issuer.OrganizationalUnit ? parsedObject.RawParse.Issuer.OrganizationalUnit[0] : null,
      countryName: parsedObject.RawParse.Issuer.Country ? parsedObject.RawParse.Issuer.Country[0] : null,
    },
    extensions: {
      keyUsage: '[ Not implemented by executable ]',
      extendedKeyUsage: parsedObject.AbstractParse.ExtendedKeyUsage,
      certificatePolicies: parsedObject.AbstractParse.PolicyIdentifiers,
    },
    serial: parsedObject.AbstractParse.SerialNumber,
    fingerPrint: parsedObject.AbstractParse.FingerPrint,
    signatureAlgorithm: parsedObject.AbstractParse.SignatureAlgorithm,
    publicKeyAlgorithm: parsedObject.AbstractParse.PublicKeyAlgorithm,
    notBefore: new Date(parsedObject.RawParse.NotBefore),
    notAfter: new Date(parsedObject.RawParse.NotAfter),
  };
}
